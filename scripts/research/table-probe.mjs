import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { Session } from 'node:inspector'
import { build } from 'esbuild'
const baseline='ca59f585e292a4788cacb95e9729a2b9a4850d59',root=process.cwd(),directory=resolve('artifacts/table-probe')
await mkdir(directory)
const sha=value=>createHash('sha256').update(value).digest('hex')
const runtimeSources=Object.fromEntries(await Promise.all(execFileSync('git',['ls-files','src'],{encoding:'utf8'}).trim().split('\n').map(async name=>[name,sha(await readFile(name))])))
const baselinePlugin={name:'frozen-source',setup(builder){builder.onLoad({filter:/\.ts$/},({path})=>{const name=relative(root,path);if(name.startsWith('src/'))return{contents:execFileSync('git',['show',baseline+':'+name],{encoding:'utf8'}),loader:'ts'}})}}
const apis=[],bundles=[]
for(const previous of [true,false]){
 const result=await build({stdin:{contents:"export * from './src/index.ts'; export * from './src/extensions/streaming.ts'; export * from './src/extensions/docs.ts'",resolveDir:root,loader:'ts'},bundle:true,write:false,platform:'node',format:'esm',target:'es2022',plugins:previous?[baselinePlugin]:[]})
 const bytes=result.outputFiles[0].contents;bundles.push(sha(bytes));await writeFile(resolve(directory,previous?'baseline.mjs':'candidate.mjs'),bytes);apis.push(await import('data:text/javascript;base64,'+Buffer.from(bytes).toString('base64')+'#'+previous))
}
const variants={baseline:apis[0],control:apis[0],candidate:apis[1]};assert.equal(variants.baseline,variants.control)
let comparisons=0
function equal(source,options){assert.deepEqual(apis[1].parseMarkdown(source,options),apis[0].parseMarkdown(source,options));assert.equal(apis[1].renderHtml(source,options),apis[0].renderHtml(source,options));comparisons++}
for(const example of createRequire(import.meta.url)('commonmark-spec').tests)equal(example.markdown)
const headers=['A | B','A\\|B','| A | B |','A | B | C'],alphabet=['-','|',':',' ','\t','\\','x']
let delimiters=['']
for(let length=1;length<=4;length++){
 const next=[]
 for(const prefix of delimiters.filter(value=>value.length===length-1))for(const char of alphabet)next.push(prefix+char)
 delimiters.push(...next)
}
for(const header of headers)for(const delimiter of delimiters)equal(header+'\n'+delimiter+'\nrow | value')
for(const source of ['Header | Last\\|\n--- | ---\nBody | Final\\|','H | I\n\u00a0- | -\u00a0','Before\nH | I\n- | -\nA | B','> H | I\n> - | -\n> A | B','- H | I\n  - | -\n  A | B'])for(let end=0;end<=source.length;end++)equal(source.slice(0,end))
function observe(api){
 const events=[];let installed=false
 const options = { extensions: [{
  name: 'observe',
  parseBlock(context) {
   events.push(['block', context.index])
   if (!installed) {
    installed = true
    for (const index of [0, 1]) {
     let value = context.lines[index]
     Object.defineProperty(context.lines, index, {
      configurable: true,
      get() { events.push(['read', index]); return value },
      set(next) { events.push(['write', index, next]); value = next },
     })
    }
   }
   return undefined
  },
  transformInline(nodes) { events.push(['inline', nodes]); return nodes },
  renderHtml(node) { events.push(['render', node.type]) },
 }] }
 Object.defineProperty(options,'headingIds',{enumerable:true,get(){events.push('headingIds');return false}})
 Object.defineProperty(options,'allowHtml',{enumerable:true,get(){events.push('allowHtml');return false}})
 const html=api.renderHtml('H | I\n- | -\nA | B\n\nAfter',options)
 return{html,events}
}
assert.deepEqual(observe(apis[1]),observe(apis[0]));comparisons++
const fixtures=[]
for(const name of ['small-doc.md','ai-response.md','tables-lists.md','malformed.md'])fixtures.push({name,source:await readFile('fixtures/benchmark/'+name,'utf8')})
fixtures.push({name:'long-table',source:'A | B | C | D\n- | - | - | -\n'+Array.from({length:128},(_,i)=>`${i} | <& | text | α`).join('\n')},{name:'wide-mismatch',source:'A | B\n'+Array(512).fill('---').join(' | ')+'\nbody'},{name:'pipe-prose',source:Array.from({length:128},(_,i)=>`Ordinary | prose ${i} with <& and words.`).join('\n')})
for(const fixture of fixtures){equal(fixture.source);for(let end=32;end<fixture.source.length;end+=32)equal(fixture.source.slice(0,end))}
const workloads=fixtures.flatMap(fixture=>['parse','render'].map(mode=>({name:fixture.name+'-'+mode,fixture,mode})))
const ai=fixtures.find(f=>f.name==='ai-response.md');workloads.push({name:'ai-progressive',fixture:ai,mode:'stream'})
function run(api,workload){
 const source=workload.fixture.source
 if(workload.mode==='parse')return sha(Buffer.from(JSON.stringify(api.parseMarkdown(source))))
 if(workload.mode==='render')return sha(Buffer.from(api.renderHtml(source)))
 const digest=createHash('sha256'),options={extensions:[api.streamingMarkdownExtension()]}
 for(let end=32;end<source.length+32;end+=32)digest.update(Buffer.from(api.renderHtml(source.slice(0,end),options))).update('\0')
 return digest.digest('hex')
}
const expected=Object.fromEntries(workloads.map(w=>{const a=run(apis[0],w);assert.equal(run(apis[1],w),a);return[w.name,a]}))
const orders=[['baseline','control','candidate'],['control','candidate','baseline'],['candidate','baseline','control'],['candidate','control','baseline'],['control','baseline','candidate'],['baseline','candidate','control']]
const iterations={}
for(const w of workloads){for(const api of Object.values(variants)){const start=performance.now();do{run(api,w)}while(performance.now()-start<100)}const start=performance.now();for(let i=0;i<5;i++)run(apis[0],w);iterations[w.name]=Math.max(3,Math.ceil(75/((performance.now()-start)/5)))}
const timings=[]
for(let round=0;round<12;round++)for(const w of workloads)for(const variant of orders[round%6]){
 global.gc();const start=performance.now();let digest
 for(let i=0;i<iterations[w.name];i++)digest=run(variants[variant],w)
 assert.equal(digest,expected[w.name]);timings.push({round,name:w.name,variant,iterations:iterations[w.name],msPerOperation:(performance.now()-start)/iterations[w.name]})
 await writeFile(resolve(directory,'partial-timings.json'),JSON.stringify(timings))
}
const session=new Session();session.connect();const post=(method,params={})=>new Promise((res,rej)=>session.post(method,params,(error,value)=>error?rej(error):res(value)));await post('HeapProfiler.enable')
const allocations=[]
try{for(const w of workloads.filter(w=>w.mode!=='stream'))for(const variant of ['baseline','control','candidate','candidate','control','baseline']){
 global.gc();await post('HeapProfiler.startSampling',{samplingInterval:16384,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true})
 for(let i=0;i<100;i++)run(variants[variant],w)
 const{profile}=await post('HeapProfiler.stopSampling');const sampledBytes=profile.samples.reduce((sum,sample)=>sum+sample.size,0)
 const serial=allocations.length;await writeFile(resolve(directory,serial+'-'+w.name+'-'+variant+'.heapprofile.json.gz'),gzipSync(JSON.stringify(profile),{level:9}));allocations.push({name:w.name,variant,iterations:100,sampledBytes})
}}finally{session.disconnect()}
for(const[name,hash]of Object.entries(runtimeSources))assert.equal(sha(await readFile(name)),hash,'Source drift: '+name)
const median=values=>{const s=[...values].sort((a,b)=>a-b),m=s.length/2;return(s[m-1]+s[m])/2}
const summary=workloads.map(w=>({name:w.name,medians:Object.fromEntries(Object.keys(variants).map(v=>[v,median(timings.filter(t=>t.name===w.name&&t.variant===v).map(t=>t.msPerOperation))]))}))
await writeFile(resolve(directory,'receipt.json'),JSON.stringify({baseline,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,versions:process.versions,cpu:(await import('node:os')).cpus()[0].model,programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),runtimeSources,bundles,comparisons,baselineControlIdentical:true,orders,expected,summary,timings,allocations,limitations:'Exact AST/HTML and callback observation before measurement. Complete AST JSON or UTF8 HTML plus SHA consumption inside measured operation. Balanced same-process warm cells with identical baseline/control. Sampled allocation includes completion consumer, not exact allocation, retained memory or peak RSS. No production acceptance until all budgets and required gates pass.'},null,2))
console.log(JSON.stringify({comparisons,summary}))
