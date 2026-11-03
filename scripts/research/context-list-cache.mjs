import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Session } from 'node:inspector'
import { gzipSync } from 'node:zlib'
const sha=value=>createHash('sha256').update(value).digest('hex')
function memoryInput(api,mode,value){
 const kind=mode.replace(/-(none|escaped)$/, '')
 if(kind==='source')return api.renderHtml(value)
 if(kind==='attribute')return api.escapeAttr(value)
 if(kind==='code')return api.renderBlock({type:'code',value})
 if(kind==='document')return api.renderHtml({type:'root',children:[{type:'code',value}]})
 if(kind==='positive')return value
 if(kind==='negative')return Buffer.from(value).toString()
 return api.renderInline({type:'text',value})
}
if(process.argv[2]==='--memory'){
 const[, , ,path,variant,mode]=process.argv,api=await import(pathToFileURL(path));const body=(mode.startsWith('source-')?'- ':'')+'q'.repeat(250)+(mode.endsWith('-escaped')?"'`tail":'')
 for(let i=0;i<100;i++)memoryInput(api,mode,body)
 const collect=()=>{ /probe/.test('probe'); for(let i=0;i<4;i++)global.gc() };collect();const before=process.memoryUsage()
 function borrowed(){const parent='P'.repeat(16*1024*1024)+body+'END';return memoryInput(api,mode,parent.slice(16*1024*1024,16*1024*1024+body.length))}
 globalThis.output=borrowed();global.gc();const unclearedHeld=process.memoryUsage();collect();const held=process.memoryUsage();const outputSHA256=sha(Buffer.from(globalThis.output));collect();const consumed=process.memoryUsage();globalThis.output=null;collect();const released=process.memoryUsage()
 console.log(JSON.stringify({variant,mode,parentBytes:16*1024*1024,inputLength:body.length,outputSHA256,before,unclearedHeld,held,consumed,released,unclearedHeapDelta:unclearedHeld.heapUsed-before.heapUsed,heldHeapDelta:held.heapUsed-before.heapUsed,consumedHeapDelta:consumed.heapUsed-before.heapUsed,releasedHeapDelta:released.heapUsed-before.heapUsed,node:process.version}));process.exit(0)
}
if(process.argv[2]==='--startup'){
 const [,,,path,variant,entry]=process.argv
 global.gc();const before=process.memoryUsage().heapUsed,start=performance.now();const api=await import(pathToFileURL(path));const elapsed=performance.now()-start;global.gc();console.log(JSON.stringify({variant,entry,elapsed,retainedHeap:process.memoryUsage().heapUsed-before,exports:Object.keys(api).sort()}));process.exit(0)
}
const baseline='2fe93336be299082ac935a5aaf76c358168942ce',root=process.cwd(),directory=resolve('artifacts/context-list-cache');await mkdir(directory,{recursive:true})
const frozen=Object.fromEntries(await Promise.all(execFileSync('git',['ls-files','src'],{encoding:'utf8'}).trim().split('\n').map(async name=>[name,sha(await readFile(name))])))
const apis=[],bundles=[]
const compiler=createRequire(import.meta.url).resolve('typescript/bin/tsc')
for(const revision of [baseline, 'HEAD']){
 const label=revision===baseline?'baseline':'candidate',buildRoot=resolve(directory,label);await mkdir(buildRoot)
 execFileSync('tar',['-x','-C',buildRoot],{input:execFileSync('git',['archive',revision,'src','package.json','tsconfig.json','tsconfig.build.json'])})
 execFileSync(process.execPath,[compiler,'-p',resolve(buildRoot,'tsconfig.build.json')],{stdio:'inherit'})
 const path=resolve(buildRoot,'entry.mjs');await writeFile(path,"export * from './dist/index.js'; export {escapeHtml,escapeAttr} from './dist/utils.js'; export * from './dist/extensions/streaming.js'; export {docsMarkdownExtensions} from './dist/extensions/docs.js'\n")
 const files=execFileSync('git',['ls-tree','-r','--name-only',revision,'src'],{encoding:'utf8'}).trim().split('\n').filter(x=>x.endsWith('.ts')).map(x=>x.replace(/^src\//,'dist/').replace(/\.ts$/,'.js'))
 const moduleHashes=Object.fromEntries(await Promise.all(files.map(async name=>[name,sha(await readFile(resolve(buildRoot,name)))])))
 bundles.push({path,sha256:sha(await readFile(path)),moduleHashes});apis.push(await import(pathToFileURL(path)))
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
for(const fixture of fixtures){const ast=apis[0].parseMarkdown(fixture.source),nextAst=apis[1].parseMarkdown(fixture.source);assert.deepEqual(nextAst,ast);for(const value of [ast,nextAst])assert.equal(apis[1].renderHtml(value),apis[0].renderHtml(value));workloads.push({name:fixture.name+'-ast',mode:'ast',astByApi:new Map([[apis[0],ast],[apis[1],nextAst]]),source:fixture.source});if(['small-doc.md','code-heavy.md','ai-response.md'].includes(fixture.name))workloads.push({name:fixture.name+'-parse-render',mode:'source',source:fixture.source})}
for(const[name,value]of [['plain-code','plain code without unsafe symbols.\n'.repeat(1024)],['quote-code',"const text = 'quoted';\n".repeat(1024)],['dense-code','<&>"\'` α\n'.repeat(1024)]])workloads.push({name,mode:'ast',ast:{type:'root',children:[{type:'code',value}]}})
workloads.push({name:'short-text-fragments',mode:'ast',ast:{type:'root',children:[{type:'paragraph',children:Array.from({length:128},(_,i)=>({type:'text',value:'word'+i}))}]}})
const ai=fixtures.find(f=>f.name==='ai-response.md');workloads.push({name:'ai-progressive',mode:'stream',source:ai.source})
const corpus=JSON.parse(await readFile('scripts/research/corpus-selection.json','utf8'))
for(const item of corpus){
 const url='https://raw.githubusercontent.com/'+item.github+'/'+item.commit+'/'+item.path.split('/').map(encodeURIComponent).join('/')
 const response=await fetch(url);assert.ok(response.ok,'Pinned input '+item.id);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(sha(bytes),item.sha256)
 const source=bytes.toString('utf8'),options={allowHtml:true,headingIds:false,extensions:apis[0].docsMarkdownExtensions()},ast=apis[0].parseMarkdown(source,options)
 const nextOptions={allowHtml:true,headingIds:false,extensions:apis[1].docsMarkdownExtensions()},nextAst=apis[1].parseMarkdown(source,nextOptions);assert.deepEqual(nextAst,ast);for(const value of [ast,nextAst])assert.equal(apis[1].renderHtml(value,nextOptions),apis[0].renderHtml(value,options))
 assert.equal(apis[0].renderHtml(source,options),apis[0].renderHtml(ast,options));assert.equal(apis[1].renderHtml(source,nextOptions),apis[0].renderHtml(source,options))
 workloads.push({name:item.id+'-docs-ast',mode:'ast',astByApi:new Map([[apis[0],ast],[apis[1],nextAst]]),optionsByApi:new Map([[apis[0],options],[apis[1],nextOptions]])},{name:item.id+'-docs-html',mode:'source',source,optionsByApi:new Map([[apis[0],options],[apis[1],nextOptions]])})
}
await writeFile(resolve(directory,'inputs.json'),JSON.stringify(corpus,null,2))
function run(api,w){if(w.mode!=='stream')return sha(Buffer.from(api.renderHtml(w.mode==='ast'?(w.astByApi?.get(api)??w.ast):w.source,w.optionsByApi?.get(api))));const hash=createHash('sha256'),options={extensions:[api.streamingMarkdownExtension()]};for(let end=32;end<w.source.length+32;end+=32)hash.update(Buffer.from(api.renderHtml(w.source.slice(0,end),options))).update('\0');return hash.digest('hex')}
const expected=Object.fromEntries(workloads.map(w=>{const hash=run(apis[0],w);assert.equal(run(apis[1],w),hash);comparisons++;return[w.name,hash]}))
const memory=[],modes=['source-none','source-escaped','text-none','text-escaped','attribute-none','attribute-escaped','code-none','code-escaped','document-none','document-escaped','positive','negative']
for(const mode of modes)for(const variant of ['baseline','control','candidate','candidate','control','baseline']){
 memory.push(JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--memory',bundles[variant==='candidate'?1:0].path,variant,mode],{encoding:'utf8',timeout:20000})))
 await writeFile(resolve(directory,'partial-memory.json'),JSON.stringify(memory))
}
for(const mode of modes)assert.equal(new Set(memory.filter(x=>x.mode===mode).map(x=>x.outputSHA256)).size,1)
const observation=(api,name,value)=>{try{return{value:api[name](value)}}catch(e){return{error:e.constructor.name,message:e.message}}}
for(const name of ['escapeHtml','escapeAttr'])for(const value of [null,undefined,12,true,{},new String('plain'),new String("'"),{replace:(regexp,callback)=>({source:regexp.source,flags:regexp.flags,escaped:callback("'")})}])assert.deepEqual(observation(apis[1],name,value),observation(apis[0],name,value))
// Ownership is a first gate. Keep raw data even if this gate fails.
for(const mode of modes.filter(x=>!['positive','negative'].includes(x))){
 const rows=memory.filter(x=>x.mode===mode),old=rows.filter(x=>x.variant!=='candidate'),next=rows.filter(x=>x.variant==='candidate')
 const baselinePins=old.every(x=>x.heldHeapDelta>8*1024*1024),candidatePins=next.every(x=>x.heldHeapDelta>8*1024*1024)
 assert.ok(baselinePins||!candidatePins,'New 16MiB parent retention: '+mode)
}
const startup=[]
for(const entry of ['index.js','html.js','parser.js','html/streaming.js'])for(const variant of ['baseline','control','candidate','candidate','control','baseline','candidate','baseline','control','control','baseline','candidate']){
 const path=resolve(directory,variant==='candidate'?'candidate':'baseline','dist',entry)
 startup.push(JSON.parse(execFileSync(process.execPath,['--expose-gc',fileURLToPath(import.meta.url),'--startup',path,variant,entry],{encoding:'utf8',timeout:20000})))
 await writeFile(resolve(directory,'startup.json'),JSON.stringify(startup))
}
const orders=[['baseline','control','candidate'],['control','candidate','baseline'],['candidate','baseline','control'],['candidate','control','baseline'],['control','baseline','candidate'],['baseline','candidate','control']],iterations={}
for(const w of workloads){for(const api of Object.values(variants)){const start=performance.now();do{run(api,w)}while(performance.now()-start<100)}const start=performance.now();for(let i=0;i<5;i++)run(apis[0],w);iterations[w.name]=Math.max(3,Math.ceil(75/((performance.now()-start)/5)))}
const timings=[]
for(let round=0;round<12;round++)for(const w of workloads)for(const variant of orders[round%6]){global.gc();const start=performance.now();let digest;for(let i=0;i<iterations[w.name];i++)digest=run(variants[variant],w);assert.equal(digest,expected[w.name]);timings.push({round,name:w.name,variant,iterations:iterations[w.name],msPerOperation:(performance.now()-start)/iterations[w.name]});await writeFile(resolve(directory,'partial-timings.json'),JSON.stringify(timings))}
const session=new Session();session.connect();const post=(method,params={})=>new Promise((res,rej)=>session.post(method,params,(error,value)=>error?rej(error):res(value)));await post('HeapProfiler.enable');const allocations=[]
try{for(const w of workloads.filter(w=>['code-heavy.md-ast','prose-heavy.md-ast','quote-code','dense-code','short-text-fragments'].includes(w.name)))for(const variant of ['baseline','control','candidate','candidate','control','baseline']){global.gc();await post('HeapProfiler.startSampling',{samplingInterval:16384,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});for(let i=0;i<100;i++)run(variants[variant],w);const{profile}=await post('HeapProfiler.stopSampling');await writeFile(resolve(directory,allocations.length+'-'+w.name+'-'+variant+'.heapprofile.json.gz'),gzipSync(JSON.stringify(profile)));allocations.push({name:w.name,variant,iterations:100,sampledBytes:profile.samples.reduce((s,v)=>s+v.size,0)})}}finally{session.disconnect()}
const extensionOutputs=apis.map(api=>{
 let outer,escaped
 const extension={name:'mutable-lines',parseBlock(context){if(context.lines[0]==='- one')outer=context.lines;if(context.lines[0]==='one'&&outer)outer[1]='- changed';escaped=context.parseBlocks}}
 const document=api.parseMarkdown('- one\n- two',{extensions:[extension]})
 const later=escaped('1. later\n2. nested')
 return {document,later}
})
assert.deepEqual(extensionOutputs[1],extensionOutputs[0])
for(const bundle of bundles)for(const[name,h]of Object.entries(bundle.moduleHashes))assert.equal(sha(await readFile(resolve(bundle.path,'..',name))),h,'Compiled module drift: '+name)
for(const[n,h]of Object.entries(frozen))assert.equal(sha(await readFile(n)),h,'Source drift: '+n)
const median=v=>{const s=[...v].sort((a,b)=>a-b),m=s.length/2;return(s[m-1]+s[m])/2};const summary=workloads.map(w=>({name:w.name,medians:Object.fromEntries(Object.keys(variants).map(v=>[v,median(timings.filter(t=>t.name===w.name&&t.variant===v).map(t=>t.msPerOperation))]))}))
await writeFile(resolve(directory,'receipt.json'),JSON.stringify({baseline,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),runtimeSources:frozen,bundles,node:process.version,versions:process.versions,cpu:(await import('node:os')).cpus()[0].model,comparisons,expected,baselineControlIdentical:true,orders,summary,timings,memory,startup,allocations,limitations:'Completed UTF8/hash consumption inside timing. Raw UTF16 equality independently checked before conversion. Balanced same-process controls, cached ASTs created by each revision with equal values and symmetric cross-render checks before warmup. Fresh-process cold imports recorded separately. Fresh-process borrowed parent memory before and after UTF8 consumption, RegExp last-match subject is cleared with a successful tiny independent match before four GCs; raw uncleared held values also retained. Input identity and explicit UTF8 copy are diagnostic controls only, never candidate algorithms. Native TypeScript build output, no TSX or bundle transforms. Parent ownership gate detects a new 16MiB retention, not a general memory tolerance. Allocation sampled including consumer, not exact or peak memory. No production acceptance without full gates.'},null,2));console.log(JSON.stringify({comparisons,summary,memory:memory.map(({variant,mode,heldHeapDelta,consumedHeapDelta})=>({variant,mode,heldHeapDelta,consumedHeapDelta}))}))
