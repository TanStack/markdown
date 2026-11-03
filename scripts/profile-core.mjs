import assert from 'node:assert/strict'
import { Session } from 'node:inspector'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { resolve, relative, dirname, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = fileURLToPath(new URL('..', import.meta.url))
const directory = resolve(process.argv[2] || 'artifacts/core-profiles')
const smoke = process.argv.includes('--smoke')
assert.equal(typeof global.gc, 'function', 'Run Node with --expose-gc')
const preloadFlags = ['--import', '--loader', '--experimental-loader', '--require', '-r']
const hasPreload = process.execArgv.some(arg => preloadFlags.some(flag => arg === flag || arg.startsWith(flag + '=')))
  || /--(?:import|(?:experimental-)?loader|require)(?:=|\s|$)|(?:^|\s)-r(?:\s|$)/.test(process.env.NODE_OPTIONS ?? '')
assert.ok(!hasPreload, 'Run with plain Node, without module loaders or preload hooks')
await mkdir(dirname(directory), { recursive: true })
try {
  await mkdir(directory)
} catch (error) {
  if (error.code === 'EEXIST') throw new Error('Output directory already exists; choose a new directory to preserve earlier profiles', { cause: error })
  throw error
}
const sha = value => createHash('sha256').update(value).digest('hex')
const runtimeDirectory = resolve(directory, 'runtime')
async function snapshot(includeRuntime = true) {
  const sourceFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort()
  return {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    trackedDirtyState: execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }),
    programSHA256: sha(await readFile(fileURLToPath(import.meta.url))),
    lockfileSHA256: sha(await readFile(resolve(root, 'pnpm-lock.yaml'))),
    buildInputs: Object.fromEntries(await Promise.all(['package.json', 'tsconfig.json', 'tsconfig.build.json'].map(async path => [path, sha(await readFile(resolve(root, path)))]))),
    compilerVersion: JSON.parse(await readFile(resolve(root, 'node_modules/typescript/package.json'), 'utf8')).version,
    ...(includeRuntime && { runtime: 'native-js', runtimeModules: Object.fromEntries(await Promise.all(
      (await readdir(runtimeDirectory, { recursive: true })).filter(path => path.endsWith('.js')).sort()
        .map(async path => [path, sha(await readFile(resolve(runtimeDirectory, path)))]),
    )) }),
    sources: Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, sha(await readFile(resolve(root, path)))]))),
  }
}
const beforeBuild = await snapshot(false)
execFileSync(process.execPath, [resolve(root, 'node_modules/typescript/bin/tsc'), '-p', resolve(root, 'tsconfig.build.json'), '--outDir', runtimeDirectory], { cwd: root, stdio: 'pipe' })
await writeFile(resolve(runtimeDirectory, 'package.json'), '{"type":"module"}\n')
assert.deepEqual(await snapshot(false), beforeBuild, 'Build inputs changed while compiling')
const frozen = await snapshot()
await writeFile(resolve(directory, 'source.json'), JSON.stringify(frozen, null, 2))
const [{ parseMarkdown }, { renderHtml }, { streamingMarkdownExtension }] = await Promise.all([
  import(pathToFileURL(resolve(runtimeDirectory, 'parser.js')).href),
  import(pathToFileURL(resolve(runtimeDirectory, 'html.js')).href),
  import(pathToFileURL(resolve(runtimeDirectory, 'extensions/streaming.js')).href),
])
const fixtures = []
for (const name of smoke ? ['small-doc.md'] : ['small-doc.md', 'prose-heavy.md', 'code-heavy.md', 'tables-lists.md', 'malformed.md', 'ai-response.md']) {
  fixtures.push({ name, source: await readFile(resolve(root, 'fixtures/benchmark', name), 'utf8') })
}
let sink = 0
const workloads = fixtures.flatMap(fixture => {
  const ast = parseMarkdown(fixture.source)
  return [
    { name: fixture.name + '-parse', source: fixture.source, run: () => parseMarkdown(fixture.source) },
    { name: fixture.name + '-parse-render', source: fixture.source, run: () => renderHtml(fixture.source) },
    { name: fixture.name + '-render-ast', source: fixture.source, run: () => renderHtml(ast) },
  ]
})
const response = await readFile(resolve(root, 'fixtures/benchmark/ai-response.md'), 'utf8')
for (const fixture of smoke ? [{ name: 'ai-prefixes', source: response.slice(0, 256) }] : [
  { name: 'ai-prefixes', source: response },
  { name: 'open-code-short', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(160) },
  { name: 'open-code-long', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(640) },
]) {
  const options = { extensions: [streamingMarkdownExtension()] }
  function renderPrefixes(trace) {
    let final = ''
    let lengthSum = 0
    for (let end = 32; end < fixture.source.length + 32; end += 32) {
      final = renderHtml(fixture.source.slice(0, end), options)
      lengthSum += final.length
      trace?.update(final).update('\0')
    }
    sink += lengthSum
    return final
  }
  workloads.push({ name: fixture.name + '-stream', source: fixture.source, run: () => renderPrefixes(), trace() {
    const hash = createHash('sha256')
    renderPrefixes(hash)
    return hash.digest('hex')
  } })
}
const session = new Session()
session.connect()
const post = (method, params = {}) => new Promise((yes, no) => session.post(method, params, (error, result) => error ? no(error) : yes(result)))
const frame = value => {
  let url = value.url
  if (url?.startsWith('file:')) {
    const path = fileURLToPath(url)
    url = path.startsWith(runtimeDirectory + sep) ? 'runtime/' + relative(runtimeDirectory, path).split(sep).join('/') : relative(root, path).split(sep).join('/')
  }
  return { function: value.functionName || '(anonymous)', url, line: value.lineNumber }
}
const consume = output => { sink += typeof output === 'string' ? output.length : output.children.length }
const rows = []
try {
  await post('Profiler.enable')
  await post('Profiler.setSamplingInterval', { interval: 1000 })
  await post('HeapProfiler.enable')
  for (const workload of workloads) {
    const expected = sha(JSON.stringify(workload.run()))
    const expectedTrace = workload.trace?.()
    for (let index = 0; index < (smoke ? 5 : 100); index++) consume(workload.run())
    global.gc()
    await post('Profiler.start')
    let completed = 0
    const start = performance.now()
    do {
      for (let index = 0; index < 10; index++) { consume(workload.run()); completed++ }
    } while (performance.now() - start < (smoke ? 20 : 300))
    const { profile: cpu } = await post('Profiler.stop')
    await writeFile(resolve(directory, workload.name + '.cpuprofile'), JSON.stringify(cpu))
    const byId = new Map(cpu.nodes.map(node => [node.id, node.callFrame]))
    const weights = new Map()
    assert.equal(cpu.samples.length, cpu.timeDeltas.length)
    for (let index = 0; index < cpu.samples.length; index++) weights.set(cpu.samples[index], (weights.get(cpu.samples[index]) || 0) + cpu.timeDeltas[index])
    const cpuTop = [...weights].map(([id, sampledSelfMicros]) => ({ ...frame(byId.get(id)), sampledSelfMicros })).sort((a, b) => b.sampledSelfMicros - a.sampledSelfMicros).slice(0, 20)
    global.gc()
    const iterations = smoke ? 5 : 100
    await post('HeapProfiler.startSampling', { samplingInterval: 16384, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true })
    for (let index = 0; index < iterations; index++) consume(workload.run())
    const { profile: allocation } = await post('HeapProfiler.stopSampling')
    await writeFile(resolve(directory, workload.name + '.heapprofile.json.gz'), gzipSync(JSON.stringify(allocation), { level: 9 }))
    const allocationTop = []
    function visit(node) { allocationTop.push({ ...frame(node.callFrame), sampledSelfBytes: node.selfSize }); for (const child of node.children || []) visit(child) }
    visit(allocation.head)
    allocationTop.sort((a, b) => b.sampledSelfBytes - a.sampledSelfBytes)
    const sampledBytes = allocation.samples.reduce((sum, sample) => sum + sample.size, 0)
    assert.equal(sha(JSON.stringify(workload.run())), expected, 'Nondeterministic completed output: ' + workload.name)
    assert.equal(workload.trace?.(), expectedTrace, 'Nondeterministic progressive output: ' + workload.name)
    rows.push({ name: workload.name, streamTraceSHA256: expectedTrace, sourceBytes: Buffer.byteLength(workload.source), sourceSHA256: sha(workload.source), outputSHA256: expected, cpuCompletedOperations: completed, cpuTop, allocationIterations: iterations, sampledBytes, sampledBytesPerOperation: sampledBytes / iterations, allocationTop: allocationTop.slice(0, 20) })
  }
} finally {
  session.disconnect()
}
const after = await snapshot()
try {
  assert.deepEqual(after, frozen, 'Source changed during profiling')
} catch (error) {
  await writeFile(resolve(directory, 'source-drift.json'), JSON.stringify({ before: frozen, after }, null, 2))
  throw error
}
const receipt = {
  schemaVersion: 1, smoke, ...frozen, sourceStable: true,
  node: process.version, versions: process.versions,
  rows, sink, recordedAt: new Date().toISOString(),
  limitations: 'Discovery profiles, not throughput or startup comparisons. CPU attribution is sampled exclusive time per workload, never add percentages across workloads. Allocation is sampled including collected objects, not retained heap, RSS, peak memory or an exact allocation count. The runtime directory is compiled from the frozen checkout before sampling, without TS loaders. Compilation is outside profiling. Inspector overhead can still differ from production execution. Repeat promising leads with equivalent completed-work controls before changing production.',
}
await writeFile(resolve(directory, 'summary.json'), JSON.stringify(receipt, null, 2))
console.log(JSON.stringify({ commit: receipt.commit, workloads: rows.length, directory, smoke }))
