import assert from 'node:assert/strict'
import { Session } from 'node:inspector'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { parseMarkdown } from '../src/parser.ts'
import { renderHtml } from '../src/html.ts'
import { streamingMarkdownExtension } from '../src/extensions/streaming.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const directory = resolve(process.argv[2] || 'artifacts/core-profiles')
const smoke = process.argv.includes('--smoke')
assert.equal(typeof global.gc, 'function', 'Run Node with --expose-gc')
await mkdir(directory, { recursive: true })
assert.equal((await readdir(directory)).length, 0, 'Output directory must be empty to preserve earlier profiles')
const sha = value => createHash('sha256').update(value).digest('hex')
const fixtures = []
for (const name of smoke ? ['small-doc.md'] : ['small-doc.md', 'prose-heavy.md', 'code-heavy.md', 'tables-lists.md', 'malformed.md', 'ai-response.md']) {
  fixtures.push({ name, source: await readFile(resolve(root, 'fixtures/benchmark', name), 'utf8') })
}
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
  { name: 'open-code-4k', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(160) },
  { name: 'open-code-16k', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(640) },
]) {
  const options = { extensions: [streamingMarkdownExtension()] }
  workloads.push({ name: fixture.name + '-stream', source: fixture.source, run() {
    const outputs = []
    for (let end = 32; end < fixture.source.length + 32; end += 32) outputs.push(renderHtml(fixture.source.slice(0, end), options))
    return outputs.join('\0')
  } })
}
const session = new Session()
session.connect()
const post = (method, params = {}) => new Promise((yes, no) => session.post(method, params, (error, result) => error ? no(error) : yes(result)))
const frame = value => ({ function: value.functionName || '(anonymous)', url: value.url?.startsWith('file:') ? relative(root, fileURLToPath(value.url)) : value.url, line: value.lineNumber })
let sink = 0
const consume = output => { sink += typeof output === 'string' ? output.length : output.children.length }
const rows = []
try {
  await post('Profiler.enable')
  await post('Profiler.setSamplingInterval', { interval: 1000 })
  await post('HeapProfiler.enable')
  for (const workload of workloads) {
    const expected = sha(JSON.stringify(workload.run()))
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
    rows.push({ name: workload.name, sourceBytes: Buffer.byteLength(workload.source), sourceSHA256: sha(workload.source), outputSHA256: expected, cpuCompletedOperations: completed, cpuTop, allocationIterations: iterations, sampledBytes, sampledBytesPerOperation: sampledBytes / iterations, allocationTop: allocationTop.slice(0, 20) })
  }
} finally {
  session.disconnect()
}
const sourceFiles = execFileSync('git', ['ls-files', 'src'], { cwd: root, encoding: 'utf8' }).trim().split('\n').filter(Boolean)
const sources = Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, sha(await readFile(resolve(root, path)))])))
const receipt = {
  schemaVersion: 1, smoke, commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  trackedDirtyState: execFileSync('git', ['status', '--porcelain', '--untracked-files=no'], { cwd: root, encoding: 'utf8' }),
  node: process.version, versions: process.versions, lockfileSHA256: sha(await readFile(resolve(root, 'pnpm-lock.yaml'))), sources,
  rows, sink, recordedAt: new Date().toISOString(),
  limitations: 'Discovery profiles, not throughput or startup comparisons. CPU attribution is sampled exclusive time per workload, never add percentages across workloads. Allocation is sampled including collected objects, not retained heap, RSS, peak memory or an exact allocation count. TS source instrumentation and inspector overhead can differ from production bundles. Repeat promising leads with equivalent completed-work controls before changing production.',
}
await writeFile(resolve(directory, 'summary.json'), JSON.stringify(receipt, null, 2))
console.log(JSON.stringify({ commit: receipt.commit, workloads: rows.length, directory, smoke }))
