import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { performance } from 'node:perf_hooks'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const sha = value => createHash('sha256').update(value).digest('hex')
if (process.argv[2] === '--borrowed') {
  const api = await import(pathToFileURL(resolve(process.argv[3])).href)
  const name = process.argv[4]
  api.createBaselineRenderer().render('```\nwarm\nup');api.createOwnedAppendRenderer().render('```\nwarm\nup')
  for(let index=0;index<4;index++) global.gc()
  const before=process.memoryUsage()
  function make(){const parent='x'.repeat(16*1024*1024)+'```text\n'+'a'.repeat(128)+'\n'+'b'.repeat(128);const source=parent.slice(16*1024*1024);const session=name==='candidate'?api.createOwnedAppendRenderer():api.createBaselineRenderer();const output=session.render(source);sha(Buffer.from(output));return {session,output,inputBytes:Buffer.byteLength(source)}}
  globalThis.packet=make()
  for(let index=0;index<4;index++) global.gc()
  const active=process.memoryUsage();globalThis.packet.session.reset()
  for(let index=0;index<4;index++) global.gc()
  const reset=process.memoryUsage()
  console.log(JSON.stringify({name,inputBytes:globalThis.packet.inputBytes,outputSHA256:sha(Buffer.from(globalThis.packet.output)),before,active,reset,activeHeapDelta:active.heapUsed-before.heapUsed,resetHeapDelta:reset.heapUsed-before.heapUsed,node:process.version}))
} else if (process.argv[2] === '--memory') {
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
  const {gzipSync,brotliCompressSync}=await import('node:zlib')
  const sizeObservations=[]
  for(const [name,contents] of [
    ['existing HTML plus streaming',"import {renderHtml} from './src/html.ts'; import {streamingMarkdownExtension} from './src/extensions/streaming.ts'; console.log(renderHtml,streamingMarkdownExtension)"],
    ['baseline private factory',"import {createBaselineRenderer} from './scripts/experimental-owned-append.mjs'; console.log(createBaselineRenderer)"],
    ['candidate factory without diagnostics',"import {createOwnedAppendRenderer} from './scripts/experimental-owned-append.mjs'; console.log(createOwnedAppendRenderer)"],
    ['proposed source namespace',"import * as streaming from './src/html/streaming.ts'; console.log(streaming)"],
    ['proposed built namespace',"import * as streaming from './dist/html/streaming.js'; console.log(streaming)"]
  ]) {
    const result=await build({stdin:{contents,resolveDir:process.cwd(),loader:'js'},bundle:true,minify:true,treeShaking:true,write:false,platform:'browser',format:'esm',target:'es2022'})
    const bytes=result.outputFiles[0].contents
    sizeObservations.push({name,min:bytes.length,gzip:gzipSync(bytes,{level:9}).length,brotli:brotliCompressSync(bytes).length,sha256:sha(bytes)})
  }
  const sourceHash = sha(await readFile('scripts/experimental-owned-append.mjs'))
  const factories = { baseline: api.createBaselineRenderer, control: api.createBaselineRenderer, candidate: api.createOwnedAppendRenderer }
  assert.equal(factories.baseline,factories.control)
  const runtimeSources = Object.fromEntries(await Promise.all(execFileSync('git',['ls-files','src'],{encoding:'utf8'}).trim().split('\n').map(async name=>[name,sha(await readFile(name))])))
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
  for (const source of ['```text\nα😀<&', '```text\n\uD83D\uDE00', '```text\nfirst\n\nlast\n', '```text title="α<&"\nbody']) check(source,1)
  function reentrant(factory) {
    const renderer=factory()
    const options={extensions:[{name:'nested',renderHtml(node){if(node.type==='paragraph')return renderer.render('```text\nnested')}}]}
    const first=renderer.render('outer',options)
    const second=renderer.render('```text\nnested plus')
    renderer.render('reset',{extensions:[{name:'reset',renderHtml(){renderer.reset()}}]})
    return [first,second,renderer.render('```text\nafter reset')]
  }
  assert.deepEqual(reentrant(factories.candidate),reentrant(factories.baseline));comparisons++
  function escapedProfile(factory,mode) {
    const renderer=factory(),events=[];let extension
    renderer.render('capture',{extensions:[{name:'capture',transformDocument(document,context){extension=context.options.extensions[0]}}]})
    if(mode==='transform') {
      const delegate=extension.transformDocument
      extension.transformDocument=(document,context)=>{events.push(document.children.map(node=>node.type==='code'?node.value:node.type));return delegate(document,context)}
    }
    if(mode==='parseBlock') extension.parseBlock=context=>{events.push([...context.lines])}
    if(mode==='render') extension.renderHtml=node=>node.type==='code'?'<pre><code>'+node.value.toUpperCase()+'</code></pre>':undefined
    const outputs=[renderer.render('```text\nalpha'),renderer.render('```text\nalpha beta')]
    renderer.reset();outputs.push(renderer.render('```text\nalpha'))
    return {events,outputs}
  }
  for(const mode of ['transform','parseBlock','render']) {assert.deepEqual(escapedProfile(factories.candidate,mode),escapedProfile(factories.baseline,mode),'Escaped mutable profile: '+mode);comparisons++}
  const response = await readFile('fixtures/benchmark/ai-response.md', 'utf8')
  const fixtures = [{ name: 'small-doc', source: await readFile('fixtures/benchmark/small-doc.md', 'utf8') }, { name: 'ai-response', source: response }, { name: 'open-code-short', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(160) }, { name: 'open-code-long', source: '```text\n' + 'Plain code and Unicode αβγ.\n'.repeat(640) }, { name: 'escaping-dense', source: '```text\n' + '<&"\' Unicode α.\n'.repeat(160) }]
  function replay(factory, fixture) {
    const renderer = factory(); let sink = 0, final
    for (let end = 32; end < fixture.source.length + 32; end += 32) { final = renderer.render(fixture.source.slice(0, end)); const bytes = Buffer.from(final);sink += bytes.length;sha(bytes) }
    return { sink, finalHash: sha(Buffer.from(final)), counters: renderer.counters }
  }
  const checks = fixtures.map(fixture => { check(fixture.source,32); const a = replay(factories.baseline, fixture), b = replay(factories.candidate, fixture);assert.equal(a.sink,b.sink);assert.equal(a.finalHash,b.finalHash);return { name:fixture.name, sourceSHA256:sha(fixture.source), ...b } })
  const memory = []
  for (const lines of [1024,4096]) for (const name of ['baseline','control','candidate','candidate','control','baseline']) memory.push(JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--memory',path,name,String(lines)],{encoding:'utf8',timeout:60000})))
  for (const lines of [1024,4096]) assert.equal(new Set(memory.filter(row=>row.lines===lines).map(row=>row.outputSHA256)).size,1)
  const median = values=>{const sorted=[...values].sort((a,b)=>a-b);const middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2}
  const borrowed=[]
  for(const name of ['baseline','control','candidate','candidate','control','baseline']) borrowed.push(JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--borrowed',path,name],{encoding:'utf8',timeout:60000})))
  assert.equal(new Set(borrowed.map(row=>row.outputSHA256)).size,1)
  if(process.argv.includes('--guards-only')) {
    await writeFile(resolve(directory,'guards.json'),JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash,bundleSHA256:sha(compiled.outputFiles[0].contents),programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),runtimeSources,baselineControlSameFactory:factories.baseline===factories.control,node:process.version,comparisons,checks,memory,borrowed,claim:'Semantic and separate retained-heap guards only; no runtime, API, size or production acceptance.'},null,2))
    console.log(JSON.stringify({comparisons,borrowed:borrowed.map(({name,activeHeapDelta,resetHeapDelta})=>({name,activeHeapDelta,resetHeapDelta}))}))
  } else {
  const iterationsByFixture = {}
  for(const fixture of fixtures) {
    for(const factory of Object.values(factories)) {
      const started=performance.now()
      do { replay(factory,fixture) } while(performance.now()-started<250)
    }
    const started=performance.now()
    for(let index=0;index<5;index++) replay(factories.baseline,fixture)
    iterationsByFixture[fixture.name]=Math.max(3,Math.ceil(150/((performance.now()-started)/5)))
  }
  const timings = []
  const timingOrders=[['baseline','control','candidate'],['control','candidate','baseline'],['candidate','baseline','control'],['candidate','control','baseline'],['control','baseline','candidate'],['baseline','candidate','control']]
  for (let round = 0; round < 12; round++) for (const fixture of fixtures) for (const name of timingOrders[round % timingOrders.length]) {
    const iterations = iterationsByFixture[fixture.name]
    global.gc?.()
    const started = performance.now();let sink=0
    for (let index=0;index<iterations;index++) sink += replay(factories[name],fixture).sink
    timings.push({ round, fixture:fixture.name, variant:name, iterations, msPerReplay:(performance.now()-started)/iterations, sink })
    await writeFile(resolve(directory,'partial.json'),JSON.stringify(timings,null,2))
  }
  const summary=fixtures.map(fixture=>({fixture:fixture.name,medians:Object.fromEntries(Object.keys(factories).map(name=>[name,median(timings.filter(row=>row.fixture===fixture.name&&row.variant===name).map(row=>row.msPerReplay))]))}))
  await writeFile(resolve(directory,'receipt.json'),JSON.stringify({commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceHash,bundleSHA256:sha(compiled.outputFiles[0].contents),programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),runtimeSources,baselineControlSameFactory:factories.baseline===factories.control,node:process.version,versions:process.versions,cpu:(await import('node:os')).cpus()[0].model,comparisons,checks,sizeObservations,iterationsByFixture,timingOrders,summary,timings,memory,borrowed,limitations:'Private stateful opt-in prototype only. Single standalone open-fence fast path; unchanged full renderer for other inputs/options. No public API, size budget, production change or release accepted. Complete UTF8/hash consumption is inside measured replay. Identical baseline/control factory, mirrored warmed same-process timing. Separate fresh-process active-session/reset heap, not allocation or peak RSS. Repetitions and full production API/size/corpus/browser/package gates still required.'},null,2))
  console.log(JSON.stringify({comparisons,summary,memory:memory.map(({name,lines,activeHeapDelta,resetHeapDelta,releasedByReset})=>({name,lines,activeHeapDelta,resetHeapDelta,releasedByReset}))}))
  }
}
