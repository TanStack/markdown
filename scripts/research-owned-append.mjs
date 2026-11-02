import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const sha = value => createHash('sha256').update(value).digest('hex')
if (process.argv[2] === '--memory') {
  const api = await import(pathToFileURL(resolve(process.argv[3])).href)
  const name = process.argv[4], lines = Number(process.argv[5])
  api.createBaselineRenderer().render('```\nwarm\nup')
  api.createOwnedAppendRenderer().render('```\nwarm\nup')
  for (let index = 0; index < 4; index++) global.gc()
  const before = process.memoryUsage()
  const session = name === 'candidate' ? api.createOwnedAppendRenderer() : api.createBaselineRenderer()
  let source = '```text\n', output
  for (let index = 0; index < lines; index += 32) {
    source += 'Plain <& Unicode α.\n'.repeat(32)
    output = session.render(source)
    sha(Buffer.from(output))
  }
  globalThis.packet = { source, output, session }
  for (let index = 0; index < 4; index++) global.gc()
  const active = process.memoryUsage()
  session.reset()
  for (let index = 0; index < 4; index++) global.gc()
  const reset = process.memoryUsage()
  console.log(JSON.stringify({ name, lines, before, active, reset, activeHeapDelta: active.heapUsed - before.heapUsed, resetHeapDelta: reset.heapUsed - before.heapUsed, releasedByReset: active.heapUsed - reset.heapUsed, sourceBytes: Buffer.byteLength(source), outputSHA256: sha(Buffer.from(output)), counters: session.counters, node: process.version }))
} else {
  const { build } = await import('esbuild')
  const directory = resolve(process.argv[2]); await mkdir(directory, { recursive: false })
  const compiled = await build({ stdin: { contents: "export * from './scripts/experimental-owned-append.mjs'; export {parseMarkdown} from './src/parser.ts'", resolveDir: process.cwd(), loader: 'js' }, bundle: true, minify: true, treeShaking: true, write: false, platform: 'node', format: 'esm', target: 'es2022' })
  const path = resolve(directory, 'api.mjs');await writeFile(path, compiled.outputFiles[0].contents)
  const api = await import(pathToFileURL(path).href)
  const sourceHash = sha(await readFile('scripts/experimental-owned-append.mjs'))
  const factories = { baseline: api.createBaselineRenderer, control: api.createBaselineRenderer, candidate: api.createOwnedAppendRenderer }
  let comparisons = 0
  function check(source, step = 7) {
    const left = factories.baseline(), right = factories.candidate()
    for (let end = 0; end < source.length + step; end += step) { const prefix = source.slice(0, end); assert.equal(right.render(prefix), left.render(prefix), 'Complete prefix: ' + JSON.stringify(prefix)); comparisons++ }
    assert.equal(right.render(source), left.render(source)); comparisons++
    right.reset();assert.equal(right.render(source), left.render(source)); comparisons++
  }
  const require = createRequire(import.meta.url)
  for (const example of require('commonmark-spec').tests) check(example.markdown)
  for (const name of (await readdir('fixtures/benchmark')).filter(name => name.endsWith('.md'))) check(await readFile('fixtures/benchmark/' + name, 'utf8'))
  for (const source of ['```js title="a<&" {1}\nconst n = 1\n', '~~~~text\nline\n~~~\nend', '```\n[ref]: /raw\n[^n]: raw\n', '```\r\nline\r\n```', '\uFEFF```\nline', '  ```\n  line\n  ```', '```\nα😀<&\u2028text', '```\nline\n```\n\n[ref]\n\n[ref]: /late']) check(source, 1)
  const left = factories.baseline(), right = factories.candidate()
  for (const source of ['```\nabc', '```\nabcdef', '```\na', 'different', '```new\nbody', { type: 'root', children: [{ type: 'thematicBreak' }] }, '```new\nbody\nlast']) { assert.equal(right.render(source), left.render(source));comparisons++ }
  function custom(factory) {
    const renderer = factory(), events = [], options = { extensions: [{ name: 'observe', parseBlock(context) { events.push(['block', context.index, [...context.lines]]) }, transformInline(nodes) { events.push(['inline', nodes.length]);return nodes }, renderHtml(node) { events.push(['render', node.type]) } }] }
    Object.defineProperty(options, 'allowHtml', { enumerable: true, get() { events.push('allowHtml');return false } })
    Object.defineProperty(options, 'highlighter', { enumerable: true, get() { events.push('highlighter');return undefined } })
    const source = '```js\nconst x = "<&"\n```\n\n**body**'
    const outputs = []
    for (let end = 0; end <= source.length; end++) outputs.push(renderer.render(source.slice(0, end), options))
    assert.throws(() => renderer.render('```\nbody', { highlighter() { throw new Error('expected') } }), /expected/)
    outputs.push(renderer.render('```\nrestored'))
    return { events, outputs }
  }
  assert.deepEqual(custom(factories.candidate), custom(factories.baseline));comparisons++
  const response = await readFile('fixtures/benchmark/ai-response.md', 'utf8')
  const fixtures = [{ name: 'small-doc', source: await readFile('fixtures/benchmark/small-doc.md', 'utf8') }, { name: 'ai-response', source: response }, { name: 'open-code-short', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(160) }, { name: 'open-code-long', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(640) }, { name: 'escaping-dense', source: '```text\n' + '<&"\' Unicode α.\n'.repeat(160) }]
  function replay(factory, fixture) {
    const renderer = factory(); let sink = 0, final
    for (let end = 32; end < fixture.source.length + 32; end += 32) { final = renderer.render(fixture.source.slice(0, end)); const bytes = Buffer.from(final);sink += bytes.length;sha(bytes) }
    return { sink, finalHash: sha(Buffer.from(final)), counters: renderer.counters }
  }
  const checks = fixtures.map(fixture => { const a = replay(factories.baseline, fixture), b = replay(factories.candidate, fixture);assert.equal(a.sink,b.sink);assert.equal(a.finalHash,b.finalHash);return { name:fixture.name, sourceSHA256:sha(fixture.source), ...b } })
  for (const fixture of fixtures) for (const factory of Object.values(factories)) for (let index = 0; index < 10; index++) replay(factory,fixture)
  const timings = []
  for (let round = 0; round < 9; round++) for (const fixture of fixtures) for (const name of round % 2 ? ['candidate','control','baseline'] : ['baseline','control','candidate']) {
    const iterations = fixture.name === 'open-code-long' ? 3 : 8
    const started = performance.now();let sink=0
    for (let index=0;index<iterations;index++) sink += replay(factories[name],fixture).sink
    timings.push({ round, fixture:fixture.name, variant:name, iterations, msPerReplay:(performance.now()-started)/iterations, sink })
    await writeFile(resolve(directory,'partial.json'),JSON.stringify(timings,null,2))
  }
  const memory = []
  for (const lines of [1024,4096]) for (const name of ['baseline','control','candidate','candidate','control','baseline']) memory.push(JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--memory',path,name,String(lines)],{encoding:'utf8',timeout:60000})))
  for (const lines of [1024,4096]) assert.equal(new Set(memory.filter(row=>row.lines===lines).map(row=>row.outputSHA256)).size,1)
  const median = values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)]
  const summary=fixtures.map(fixture=>({fixture:fixture.name,medians:Object.fromEntries(Object.keys(factories).map(name=>[name,median(timings.filter(row=>row.fixture===fixture.name&&row.variant===name).map(row=>row.msPerReplay))]))}))
  await writeFile(resolve(directory,'receipt.json'),JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash,bundleSHA256:sha(compiled.outputFiles[0].contents),programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),node:process.version,versions:process.versions,cpu:(await import('node:os')).cpus()[0].model,comparisons,checks,summary,timings,memory,limitations:'Private stateful opt-in prototype only. Single standalone open-fence fast path; unchanged full renderer for other inputs/options. No public API, size budget, production change or release accepted. Complete UTF8/hash consumption is inside measured replay. Identical baseline/control factory, mirrored warmed same-process timing. Separate fresh-process active-session/reset heap, not allocation or peak RSS. Repetitions and full production API/size/corpus/browser/package gates still required.'},null,2))
  console.log(JSON.stringify({comparisons,summary,memory:memory.map(({name,lines,activeHeapDelta,resetHeapDelta,releasedByReset})=>({name,lines,activeHeapDelta,resetHeapDelta,releasedByReset}))}))
}
