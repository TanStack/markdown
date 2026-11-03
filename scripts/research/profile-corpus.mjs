import assert from 'node:assert/strict'
import { Session } from 'node:inspector'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { resolve, relative, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

const root = fileURLToPath(new URL('../..', import.meta.url))
const directory = resolve(process.argv[2] || 'artifacts/core-profiles')
const smoke = process.argv.includes('--smoke')
assert.equal(typeof global.gc, 'function', 'Run Node with --expose-gc')
await mkdir(dirname(directory), { recursive: true })
try {
  await mkdir(directory)
} catch (error) {
  if (error.code === 'EEXIST') throw new Error('Output directory already exists; choose a new directory to preserve earlier profiles', { cause: error })
  throw error
}
const sha = value => createHash('sha256').update(value).digest('hex')
async function snapshot() {
  const sourceFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', 'src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean).sort()
  return {
    commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
    trackedDirtyState: execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }),
    programSHA256: sha(await readFile(fileURLToPath(import.meta.url))),
    lockfileSHA256: sha(await readFile(resolve(root, 'pnpm-lock.yaml'))),
    compiledJS:Object.fromEntries(await Promise.all((await readdir(resolve(root,'dist'),{recursive:true})).filter(name=>name.endsWith('.js')).sort().map(async name=>[name,sha(await readFile(resolve(root,'dist',name)))]))),
    sources: Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, sha(await readFile(resolve(root, path)))]))),
  }
}
const frozen = await snapshot()
await writeFile(resolve(directory, 'source.json'), JSON.stringify(frozen, null, 2))
const [{ parseMarkdown }, { renderHtml }, { docsMarkdownExtensions }] = await Promise.all([
  import('../../dist/parser.js'), import('../../dist/html.js'), import('../../dist/extensions/docs.js'),
])
const selection = JSON.parse(await readFile(resolve(root,'scripts/research/corpus-selection.json'),'utf8'))
const fixtures = []
for (const item of selection) {
  const url = 'https://raw.githubusercontent.com/' + item.github + '/' + item.commit + '/' + item.path.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(url)
  assert.ok(response.ok, 'Pinned source download: ' + item.id + ' HTTP ' + response.status)
  const bytes = Buffer.from(await response.arrayBuffer())
  assert.equal(sha(bytes), item.sha256, 'Pinned raw source hash: ' + item.id)
  fixtures.push({ ...item, name: item.id, source: bytes.toString('utf8') })
}
for (const name of ['small-doc.md','prose-heavy.md','code-heavy.md','tables-lists.md','malformed.md','ai-response.md']) {
  const source = await readFile(resolve(root,'fixtures/benchmark',name),'utf8')
  fixtures.push({name:'fixture-'+name, source, bytes:Buffer.byteLength(source),sha256:sha(source)})
}
await writeFile(resolve(directory,'inputs.json'),JSON.stringify(fixtures.map(({source,...metadata})=>metadata),null,2))
let sink = 0
const workloads = fixtures.flatMap(fixture => {
  const core = {}
  const docs = {allowHtml:true,headingIds:false,extensions:docsMarkdownExtensions()}
  const ast = parseMarkdown(fixture.source, docs)
  assert.equal(renderHtml(ast,docs),renderHtml(fixture.source,docs),'Same completed docs output: '+fixture.name)
  return [
    {name:fixture.name+'-core-html',source:fixture.source,run:()=>renderHtml(fixture.source,core)},
    {name:fixture.name+'-docs-html',source:fixture.source,run:()=>renderHtml(fixture.source,docs)},
    {name:fixture.name+'-docs-render-ast',source:fixture.source,run:()=>renderHtml(ast,docs)},
  ]
})
if (process.argv.includes('--reverse')) workloads.reverse()
const session = new Session()
session.connect()
const post = (method, params = {}) => new Promise((yes, no) => session.post(method, params, (error, result) => error ? no(error) : yes(result)))
const frame = value => ({ function: value.functionName || '(anonymous)', url: value.url?.startsWith('file:') ? relative(root, fileURLToPath(value.url)) : value.url, line: value.lineNumber })
const consume = output => { const bytes=Buffer.from(output);sink += bytes.length + sha(bytes).charCodeAt(0) }
const rows = []
try {
  await post('Profiler.enable')
  await post('Profiler.setSamplingInterval', { interval: 1000 })
  await post('HeapProfiler.enable')
  for (const workload of workloads) {
    const expected = sha(Buffer.from(workload.run()))
    const sampleIterations = Math.max(3,Math.min(100,Math.floor(2_000_000/Math.max(1,Buffer.byteLength(workload.source)))))
    const expectedTrace = workload.trace?.()
    for (let index = 0; index < (smoke ? 5 : sampleIterations); index++) consume(workload.run())
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
    const cpuModuleMicros = {}
    for (const [id,micros] of weights) {
      const value=frame(byId.get(id)),url=value.url||''
      const group=url.startsWith('dist/extensions/')?'dist/extensions':url.startsWith('dist/')?url:url.startsWith('scripts/')?'research/consumer':value.function==='(garbage collector)'?'garbage collector':'runtime/native/other'
      cpuModuleMicros[group]=(cpuModuleMicros[group]||0)+micros
    }
    const cpuTop = [...weights].map(([id, sampledSelfMicros]) => ({ ...frame(byId.get(id)), sampledSelfMicros })).sort((a, b) => b.sampledSelfMicros - a.sampledSelfMicros).slice(0, 20)
    global.gc()
    const iterations = smoke ? 5 : sampleIterations
    await post('HeapProfiler.startSampling', { samplingInterval: 16384, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true })
    for (let index = 0; index < iterations; index++) consume(workload.run())
    const { profile: allocation } = await post('HeapProfiler.stopSampling')
    await writeFile(resolve(directory, workload.name + '.heapprofile.json.gz'), gzipSync(JSON.stringify(allocation), { level: 9 }))
    const allocationTop = []
    function visit(node) { allocationTop.push({ ...frame(node.callFrame), sampledSelfBytes: node.selfSize }); for (const child of node.children || []) visit(child) }
    visit(allocation.head)
    allocationTop.sort((a, b) => b.sampledSelfBytes - a.sampledSelfBytes)
    const sampledBytes = allocation.samples.reduce((sum, sample) => sum + sample.size, 0)
    assert.equal(sha(Buffer.from(workload.run())), expected, 'Nondeterministic completed output: ' + workload.name)
    assert.equal(workload.trace?.(), expectedTrace, 'Nondeterministic progressive output: ' + workload.name)
    rows.push({ name: workload.name, streamTraceSHA256: expectedTrace, sourceBytes: Buffer.byteLength(workload.source), sourceSHA256: sha(workload.source), outputSHA256: expected, cpuCompletedOperations: completed, cpuModuleMicros, cpuTop, allocationIterations: iterations, sampledBytes, sampledBytesPerOperation: sampledBytes / iterations, allocationTop: allocationTop.slice(0, 20) })
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
  schemaVersion: 1, smoke, ...frozen, sourceStable: true,emission:'plain Node native JS, byte-identical to actual1.2.0', reverse:process.argv.includes('--reverse'),selectionSHA256:sha(await readFile(resolve(root,'scripts/research/corpus-selection.json'))),
  node: process.version, versions: process.versions,
  rows, sink, recordedAt: new Date().toISOString(),
  limitations: 'Stratified corpus discovery, not a population or traffic model. Core and docs profiles have different supported outputs and are not like-for-like speed comparisons. HTML UTF8 and SHA consumer included. JS heap samples exclude native/external allocation. Adaptive iterations per source size, same policy both controls. Discovery profiles, not throughput or startup comparisons. CPU attribution is sampled exclusive time per workload, never add percentages across workloads. Allocation is sampled including collected objects, not retained heap, RSS, peak memory or an exact allocation count. TS source instrumentation and inspector overhead can differ from production bundles. Repeat promising leads with equivalent completed-work controls before changing production.',
}
await writeFile(resolve(directory, 'summary.json'), JSON.stringify(receipt, null, 2))
console.log(JSON.stringify({ commit: receipt.commit, workloads: rows.length, directory, smoke }))
