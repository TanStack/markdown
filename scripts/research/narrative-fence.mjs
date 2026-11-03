import assert from 'node:assert/strict'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {performance} from 'node:perf_hooks'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {gzipSync,brotliCompressSync} from 'node:zlib'
import {build} from 'esbuild'
const sha=x=>createHash('sha256').update(x).digest('hex')
if(process.argv[2]==='--memory'){
 const api=await import(pathToFileURL(resolve(process.argv[3])).href),mode=process.argv[4]
 const prefix=mode==='standalone'?'':mode==='narrative'?'# Answer\n\nHere is code.\n\n':'```old\none\n```\n\nNext\n\n'
 const input=prefix+'```text\n'+'Plain <& α😀\n'.repeat(16)
 api.createStreamingHtmlRenderer().render(input)
 const collect=()=>{ /probe/.test('probe');for(let n=0;n<4;n++)global.gc() }
 collect();const before=process.memoryUsage()
 function make(){const parent='x'.repeat(16*1024*1024)+input;const source=parent.slice(16*1024*1024);const session=api.createStreamingHtmlRenderer();const output=session.render(source);return {session,output}}
 globalThis.packet=make();collect();const held=process.memoryUsage();const outputSHA256=sha(Buffer.from(globalThis.packet.output));collect();const consumed=process.memoryUsage()
 globalThis.packet.session.reset();collect();const reset=process.memoryUsage();globalThis.packet=null;collect();const released=process.memoryUsage()
 console.log(JSON.stringify({mode,before,held,consumed,reset,released,heldHeapDelta:held.heapUsed-before.heapUsed,resetHeapDelta:reset.heapUsed-before.heapUsed,releasedHeapDelta:released.heapUsed-before.heapUsed,outputSHA256,node:process.version}));process.exit(0)
}
const directory=resolve(process.argv[2]);await mkdir(directory,{recursive:true})
const baseline='ca59f585e292a4788cacb95e9729a2b9a4850d59'
const old=execFileSync('git',['show',baseline+':src/html/streaming.ts'],{encoding:'utf8'})
for(const variant of ['baseline','candidate']){
 const b=await build({entryPoints:['src/html/streaming.ts'],bundle:true,write:false,minify:true,platform:'node',format:'esm',target:'es2022',plugins:variant==='baseline'?[{name:'frozen-baseline',setup(b){b.onLoad({filter:/\/src\/html\/streaming\.ts$/},()=>({contents:old,loader:'ts',resolveDir:resolve('src/html')}))}}]:[]})
 await writeFile(resolve(directory,variant+'.mjs'),b.outputFiles[0].contents)
}
const a=await import(pathToFileURL(resolve(directory,'baseline.mjs')).href),b=await import(pathToFileURL(resolve(directory,'candidate.mjs')).href)
const factories={baseline:a.createStreamingHtmlRenderer,control:a.createStreamingHtmlRenderer,candidate:b.createStreamingHtmlRenderer}
let comparisons=0
function check(source){const x=factories.baseline(),y=factories.candidate();for(let end=0;end<=source.length;end++){const prefix=source.slice(0,end);assert.equal(y.render(prefix),x.render(prefix));comparisons++}y.reset();assert.equal(y.render(source),x.render(source));comparisons++}
for(const intro of ['', 'Intro\n\n','# Heading\n\n','- item\n\n','> quote\n\n','```old\none\n```\n\n','[a]\n\n[a]: /target\n\n','[^n]\n\n[^n]: note\n\n','---\ntitle: Example\n---\n\n'])for(const fence of ['```','~~~~'])for(const body of ['<& α😀\nlast','[a]: /raw\n\n[^n]: raw','plain\n\n```js\nlast'])check(intro+fence+'ts title="<&"\n'+body+'\n'+fence+'\n\nDone')
let seed=20903;for(let i=0;i<150;i++){let body='';for(let n=0;n<60;n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;body+='a\n\n`~[]<& α😀'[seed%14]}check('Answer '+i+'\n\n```js\n'+body)}
const workloads=[]
for(const lines of [64,512])for(const [kind,line] of [['plain','const x = 1;\n'],['dense','<>&"\' α😀\n']])for(const intro of ['', '# Answer\n\nHere is the code.\n\n']){let source=intro+'```js\n';const updates=[];for(let n=0;n<lines;n+=16){source+=line.repeat(16);updates.push(source)}workloads.push({name:kind+'-'+lines+'-'+(intro?'narrative':'standalone'),updates})}
for(const file of ['ai-response.md','prose-heavy.md','code-heavy.md','tables-lists.md']){const source=await readFile('fixtures/benchmark/'+file,'utf8'),updates=[];for(let end=16;end<source.length;end+=16)updates.push(source.slice(0,end));updates.push(source);workloads.push({name:file,updates})}
function run(factory,w){const renderer=factory();const hash=createHash('sha256');for(const source of w.updates){const output=Buffer.from(renderer.render(source));hash.update(String(output.length)+':');hash.update(output)}return hash.digest('hex')}
const expected={};for(const w of workloads){expected[w.name]=run(factories.baseline,w);for(const factory of Object.values(factories)){if(run(factory,w)!==expected[w.name]){const x=factories.baseline(),y=factory();for(const source of w.updates){const expected=x.render(source),actual=y.render(source);if(expected!==actual){await writeFile(resolve(directory,'mismatch.json'),JSON.stringify({name:w.name,source,expected,actual},null,2));throw new Error('Completed output mismatch: '+w.name)}}throw new Error('Digest mismatch without output difference')}for(let n=0;n<10;n++)run(factory,w)}}
const orders=[['baseline','control','candidate'],['candidate','control','baseline'],['control','baseline','candidate'],['candidate','baseline','control'],['baseline','candidate','control'],['control','candidate','baseline']];const timings=[]
for(let round=0;round<12;round++)for(const w of workloads)for(const variant of orders[round%6]){let n=0;const start=performance.now();do{assert.equal(run(factories[variant],w),expected[w.name]);n++}while(performance.now()-start<30);timings.push({round,name:w.name,variant,iterations:n,msPerOperation:(performance.now()-start)/n})}
const median=x=>{x.sort((a,b)=>a-b);return (x[(x.length-1)>>1]+x[x.length>>1])/2}
const summary=workloads.map(w=>({name:w.name,medians:Object.fromEntries(Object.keys(factories).map(v=>[v,median(timings.filter(t=>t.name===w.name&&t.variant===v).map(t=>t.msPerOperation))]))}))
const sizes=[];for(const v of ['baseline','candidate']){const bytes=await readFile(resolve(directory,v+'.mjs'));sizes.push({variant:v,min:bytes.length,gzip:gzipSync(bytes,{level:9}).length,brotli:brotliCompressSync(bytes).length,sha256:sha(bytes)})}
const memory=[];for(const mode of ['standalone','narrative','prior-code'])for(let replica=0;replica<2;replica++)for(const variant of ['baseline','control','candidate'])memory.push({variant,replica,...JSON.parse(execFileSync(process.execPath,['--expose-gc','scripts/research/narrative-fence.mjs','--memory',resolve(directory,(variant==='control'?'baseline':variant)+'.mjs'),mode],{encoding:'utf8'}))});
const receipt={memory,baseline,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),programSHA256:sha(await readFile('scripts/research/narrative-fence.mjs')),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),runtimeSources:Object.fromEntries(await Promise.all(execFileSync('git',['ls-files','src'],{encoding:'utf8'}).trim().split('\n').map(async p=>[p,sha(await readFile(p))]))),node:process.version,cpu:(await import('node:os')).cpus()[0],comparisons,expected,orders,timings,summary,sizes,limitations:'Completed progressive HTML/UTF8/hash work in balanced warmed sessions. Not startup, allocation, peak/RSS or full production acceptance. Fresh-child retained heap checks clear ambient RegExp statics before four collections, measure output live before UTF8 consumption, then reset and released states; not peak memory. Node bundle size is discovery only; existing browser/package size gates remain authoritative.'}
await writeFile(resolve(directory,'receipt.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify({comparisons,summary,sizes}))
