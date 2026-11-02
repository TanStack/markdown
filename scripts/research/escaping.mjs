import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Session } from 'node:inspector'
import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'
const sha=value=>createHash('sha256').update(value).digest('hex')
function memoryInput(api,mode,value){
 if(mode==='attribute')return api.escapeAttr(value)
 if(mode==='link')return api.renderInline({type:'link',href:value,children:[{type:'text',value:'link'}]})
 if(mode==='code')return api.renderBlock({type:'code',value})
 if(mode==='document')return api.renderHtml({type:'root',children:[{type:'code',value}]})
 return api.renderInline({type:'text',value})
}
if(process.argv[2]==='--memory'){
 const[, , ,path,variant,mode]=process.argv,api=await import(pathToFileURL(path));const body=mode==='attribute'?'https://example.test/'+ 'q'.repeat(220)+'`tail':mode==='plain'?'q'.repeat(250):'q'.repeat(220)+"'tail"
 for(let i=0;i<100;i++)memoryInput(api,mode,body)
 global.gc();const before=process.memoryUsage()
 function borrowed(){const parent='P'.repeat(16*1024*1024)+body+'END';return memoryInput(api,mode,parent.slice(16*1024*1024,16*1024*1024+body.length))}
 globalThis.output=borrowed();global.gc();const held=process.memoryUsage();const outputSHA256=sha(Buffer.from(globalThis.output));global.gc();const consumed=process.memoryUsage();globalThis.output=null;global.gc();const released=process.memoryUsage()
 console.log(JSON.stringify({variant,mode,parentBytes:16*1024*1024,inputLength:body.length,outputSHA256,before,held,consumed,released,heldHeapDelta:held.heapUsed-before.heapUsed,consumedHeapDelta:consumed.heapUsed-before.heapUsed,releasedHeapDelta:released.heapUsed-before.heapUsed,node:process.version}));process.exit(0)
}
const baseline='ca59f585e292a4788cacb95e9729a2b9a4850d59',root=process.cwd(),directory=resolve('artifacts/escaping');await mkdir(directory)
const frozen=Object.fromEntries(await Promise.all(execFileSync('git',['ls-files','src'],{encoding:'utf8'}).trim().split('\n').map(async name=>[name,sha(await readFile(name))])))
const plugin={name:'frozen-baseline',setup(builder){builder.onLoad({filter:/\.ts$/},({path})=>{const name=relative(root,path);if(name.startsWith('src/'))return{contents:execFileSync('git',['show',baseline+':'+name],{encoding:'utf8'}),loader:'ts'}})}}
const apis=[],bundles=[]
for(const previous of [true,false]){
 const result=await build({stdin:{contents:"export * from './src/index.ts'; export {escapeHtml,escapeAttr} from './src/utils.ts'; export * from './src/extensions/streaming.ts'",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',target:'es2022',plugins:previous?[plugin]:[]})
 const path=resolve(directory,previous?'baseline.mjs':'candidate.mjs'),bytes=result.outputFiles[0].contents;await writeFile(path,bytes);bundles.push({path,sha256:sha(bytes)});apis.push(await import(pathToFileURL(path)))
}
const variants={baseline:apis[0],control:apis[0],candidate:apis[1]};assert.equal(variants.baseline,variants.control);let comparisons=0
function equal(value){assert.equal(apis[1].escapeHtml(value),apis[0].escapeHtml(value));assert.equal(apis[1].escapeAttr(value),apis[0].escapeAttr(value));assert.equal(apis[1].renderInline({type:'text',value}),apis[0].renderInline({type:'text',value}));comparisons++}
for(let i=0;i<65536;i++)equal(String.fromCharCode(i))
equal(Array.from({length:65536},(_,i)=>String.fromCharCode(i)).join(''))
let seed=731;const alphabet=['&','<','>','"',"'",'`',';','$','\0','\r','\n','😀','\uD800','\uDC00','a']
for(let i=0;i<2048;i++){let value='';for(let j=0;j<i%64;j++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;value+=alphabet[seed%alphabet.length]}equal(value)}
for(const example of createRequire(import.meta.url)('commonmark-spec').tests){for(const options of [{},{allowHtml:true,headingIds:false}])assert.equal(apis[1].renderHtml(example.markdown,options),apis[0].renderHtml(example.markdown,options));comparisons++}
const fixtures=[]
for(const name of ['small-doc.md','prose-heavy.md','code-heavy.md','tables-lists.md','malformed.md','ai-response.md'])fixtures.push({name,source:await readFile('fixtures/benchmark/'+name,'utf8')})
const workloads=[]
for(const fixture of fixtures){const ast=apis[0].parseMarkdown(fixture.source);assert.deepEqual(apis[1].parseMarkdown(fixture.source),ast);assert.equal(apis[1].renderHtml(ast),apis[0].renderHtml(ast));workloads.push({name:fixture.name+'-ast',mode:'ast',ast,source:fixture.source});if(['small-doc.md','code-heavy.md','ai-response.md'].includes(fixture.name))workloads.push({name:fixture.name+'-parse-render',mode:'source',source:fixture.source})}
for(const[name,value]of [['plain-code','plain code without unsafe symbols.\n'.repeat(1024)],['quote-code',"const text = 'quoted';\n".repeat(1024)],['dense-code','<&>"\'` α\n'.repeat(1024)]])workloads.push({name,mode:'ast',ast:{type:'root',children:[{type:'code',value}]}})
workloads.push({name:'short-text-fragments',mode:'ast',ast:{type:'root',children:[{type:'paragraph',children:Array.from({length:128},(_,i)=>({type:'text',value:'word'+i}))}]}})
const ai=fixtures.find(f=>f.name==='ai-response.md');workloads.push({name:'ai-progressive',mode:'stream',source:ai.source})
function run(api,w){if(w.mode!=='stream')return sha(Buffer.from(api.renderHtml(w.mode==='ast'?w.ast:w.source)));const hash=createHash('sha256'),options={extensions:[api.streamingMarkdownExtension()]};for(let end=32;end<w.source.length+32;end+=32)hash.update(Buffer.from(api.renderHtml(w.source.slice(0,end),options))).update('\0');return hash.digest('hex')}
const expected=Object.fromEntries(workloads.map(w=>{const hash=run(apis[0],w);assert.equal(run(apis[1],w),hash);comparisons++;return[w.name,hash]}))
const memory=[]
for(const mode of ['text','attribute','link','code','document','plain'])for(const variant of ['baseline','control','candidate','candidate','control','baseline'])memory.push(JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--memory',bundles[variant==='candidate'?1:0].path,variant,mode],{encoding:'utf8',timeout:20000})))
for(const mode of ['text','attribute','link','code','document','plain'])assert.equal(new Set(memory.filter(x=>x.mode===mode).map(x=>x.outputSHA256)).size,1)
const orders=[['baseline','control','candidate'],['control','candidate','baseline'],['candidate','baseline','control'],['candidate','control','baseline'],['control','baseline','candidate'],['baseline','candidate','control']],iterations={}
for(const w of workloads){for(const api of Object.values(variants)){const start=performance.now();do{run(api,w)}while(performance.now()-start<100)}const start=performance.now();for(let i=0;i<5;i++)run(apis[0],w);iterations[w.name]=Math.max(3,Math.ceil(75/((performance.now()-start)/5)))}
const timings=[]
for(let round=0;round<12;round++)for(const w of workloads)for(const variant of orders[round%6]){global.gc();const start=performance.now();let digest;for(let i=0;i<iterations[w.name];i++)digest=run(variants[variant],w);assert.equal(digest,expected[w.name]);timings.push({round,name:w.name,variant,iterations:iterations[w.name],msPerOperation:(performance.now()-start)/iterations[w.name]});await writeFile(resolve(directory,'partial-timings.json'),JSON.stringify(timings))}
const session=new Session();session.connect();const post=(method,params={})=>new Promise((res,rej)=>session.post(method,params,(error,value)=>error?rej(error):res(value)));await post('HeapProfiler.enable');const allocations=[]
try{for(const w of workloads.filter(w=>['code-heavy.md-ast','prose-heavy.md-ast','quote-code','dense-code','short-text-fragments'].includes(w.name)))for(const variant of ['baseline','control','candidate','candidate','control','baseline']){global.gc();await post('HeapProfiler.startSampling',{samplingInterval:16384,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});for(let i=0;i<100;i++)run(variants[variant],w);const{profile}=await post('HeapProfiler.stopSampling');await writeFile(resolve(directory,allocations.length+'-'+w.name+'-'+variant+'.heapprofile.json.gz'),gzipSync(JSON.stringify(profile)));allocations.push({name:w.name,variant,iterations:100,sampledBytes:profile.samples.reduce((s,v)=>s+v.size,0)})}}finally{session.disconnect()}
for(const[n,h]of Object.entries(frozen))assert.equal(sha(await readFile(n)),h,'Source drift: '+n)
const median=v=>{const s=[...v].sort((a,b)=>a-b),m=s.length/2;return(s[m-1]+s[m])/2};const summary=workloads.map(w=>({name:w.name,medians:Object.fromEntries(Object.keys(variants).map(v=>[v,median(timings.filter(t=>t.name===w.name&&t.variant===v).map(t=>t.msPerOperation))]))}))
await writeFile(resolve(directory,'receipt.json'),JSON.stringify({baseline,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),runtimeSources:frozen,bundles,node:process.version,versions:process.versions,cpu:(await import('node:os')).cpus()[0].model,comparisons,expected,baselineControlIdentical:true,orders,summary,timings,memory,allocations,limitations:'Completed UTF8/hash consumption inside timing. Raw UTF16 equality independently checked before conversion. Balanced same-process controls, not native cold-import timing. Fresh-process borrowed parent memory before and after UTF8 consumption, plain-path baseline pin is an intentional positive control. Allocation sampled including consumer, not exact or peak memory. No production acceptance without full gates.'},null,2));console.log(JSON.stringify({comparisons,summary,memory:memory.map(({variant,mode,heldHeapDelta,consumedHeapDelta})=>({variant,mode,heldHeapDelta,consumedHeapDelta}))}))
