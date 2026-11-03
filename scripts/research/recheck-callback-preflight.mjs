import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises'
import {createRequire} from 'node:module'
import {resolve,dirname} from 'node:path'
import {pathToFileURL,fileURLToPath} from 'node:url'
import {Session} from 'node:inspector'
import {gzipSync} from 'node:zlib'
const sha=x=>createHash('sha256').update(x).digest('hex')
if(['--cpu','--allocation'].includes(process.argv[2])){
 const [,,mode,entry,inputPath,role,profilePath]=process.argv,input=JSON.parse(await readFile(inputPath,'utf8')),api=await import(pathToFileURL(entry))
 const options=input.profile==='docs'?{allowHtml:true,headingIds:false,extensions:api.docsMarkdownExtensions()}:input.mode==='stream'?{extensions:[api.streamingMarkdownExtension()]}:{}
 const ast=input.mode==='ast'?api.parseMarkdown(input.source,options):undefined
 const complete=()=>{if(input.mode!=='stream')return sha(Buffer.from(api.renderHtml(input.mode==='ast'?ast:input.source,options)));const hash=createHash('sha256');for(let end=32;end<input.source.length+32;end+=32)hash.update(Buffer.from(api.renderHtml(input.source.slice(0,end),options))).update('\0');return hash.digest('hex')}
 const bytes=Buffer.byteLength(input.source),warmup=input.mode==='stream'?30:Math.max(20,Math.min(5000,Math.ceil(64_000_000/bytes))),iterations=input.mode==='stream'?10:Math.max(3,Math.min(1000,Math.ceil(4_000_000/bytes)))
 let expected;for(let i=0;i<warmup;i++){const digest=complete();if(expected===undefined)expected=digest;assert.equal(digest,expected)}
 const row={name:input.name,role,mode,node:process.version,warmup,iterations,expected,inputSHA256:sha(input.source)}
 if(mode==='--cpu'){
  row.samples=[];for(let batch=0;batch<6;batch++){global.gc();const start=performance.now();for(let i=0;i<iterations;i++)assert.equal(complete(),expected);row.samples.push({batch,msPerOperation:(performance.now()-start)/iterations})}
 }else{
  row.iterations=Math.max(3,Math.min(100,Math.floor(2_000_000/bytes)));global.gc();const session=new Session();session.connect();const post=(m,p={})=>new Promise((yes,no)=>session.post(m,p,(e,v)=>e?no(e):yes(v)))
  try{await post('HeapProfiler.enable');await post('HeapProfiler.startSampling',{samplingInterval:16384,includeObjectsCollectedByMajorGC:true,includeObjectsCollectedByMinorGC:true});for(let i=0;i<row.iterations;i++)assert.equal(complete(),expected);const {profile}=await post('HeapProfiler.stopSampling');await writeFile(profilePath,gzipSync(JSON.stringify(profile)));row.sampledBytes=profile.samples.reduce((s,r)=>s+r.size,0);row.profileSHA256=sha(await readFile(profilePath))}finally{session.disconnect()}
 }
 console.log(JSON.stringify(row));process.exit(0)
}
const baseline='2fe93336be299082ac935a5aaf76c358168942ce',directory=resolve(process.argv[2]||'artifacts/callback-control-recheck'),require=createRequire(import.meta.url),compiler=require.resolve('typescript/bin/tsc'),program=fileURLToPath(import.meta.url)
await mkdir(dirname(directory),{recursive:true})
await mkdir(directory)
const sources=Object.fromEntries(await Promise.all(execFileSync('git',['ls-files','src'],{encoding:'utf8'}).trim().split('\n').map(async p=>[p,sha(await readFile(p))]))),programSHA256=sha(await readFile(program)),lockfileSHA256=sha(await readFile('pnpm-lock.yaml')),builds=[]
for(const role of ['baseline','control','candidate']){
 const root=resolve(directory,role);await mkdir(root);execFileSync('tar',['-x','-C',root],{input:execFileSync('git',['archive',role==='candidate'?'HEAD':baseline,'src','package.json','tsconfig.json','tsconfig.build.json'])});execFileSync(process.execPath,[compiler,'-p',resolve(root,'tsconfig.build.json')],{stdio:'inherit'})
 const entry=resolve(root,'entry.mjs');await writeFile(entry,"export * from './dist/index.js';export {docsMarkdownExtensions} from './dist/extensions/docs.js';export {streamingMarkdownExtension} from './dist/extensions/streaming.js'\n")
 const hashes=Object.fromEntries(await Promise.all((await readdir(resolve(root,'dist'),{recursive:true})).filter(x=>x.endsWith('.js')).sort().map(async p=>[p,sha(await readFile(resolve(root,'dist',p)))])));builds.push({role,entry,hashes})
}
assert.deepEqual(builds[0].hashes,builds[1].hashes)
const slot=resolve(directory,'same-path-runtime');await mkdir(slot);await writeFile(resolve(slot,'package.json'),JSON.stringify({type:'module'}));
async function stage(role){const build=builds.find(x=>x.role===role);await cp(resolve(build.entry,'..','dist'),resolve(slot,'dist'),{recursive:true,force:true});await cp(build.entry,resolve(slot,'entry.mjs'));for(const[p,h]of Object.entries(build.hashes))assert.equal(sha(await readFile(resolve(slot,'dist',p))),h);return resolve(slot,'entry.mjs')}
const inputs=[],selection=JSON.parse(await readFile('scripts/research/corpus-selection.json','utf8'))
for(const item of selection.filter(x=>['corpus-02','corpus-04','corpus-05','corpus-07'].includes(x.id))){const response=await fetch('https://raw.githubusercontent.com/'+item.github+'/'+item.commit+'/'+item.path.split('/').map(encodeURIComponent).join('/'));assert.ok(response.ok);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(sha(bytes),item.sha256);inputs.push({name:item.id+'-docs-html',source:bytes.toString('utf8'),profile:'docs',mode:'source',origin:item})}
for(const name of ['prose-heavy.md','code-heavy.md','ai-response.md']){
 const source=await readFile('fixtures/benchmark/'+name,'utf8');inputs.push({name:name+'-html',source,profile:'core',mode:'source'})
 if(name!=='ai-response.md')inputs.push({name:name+'-ast',source,profile:'core',mode:'ast'})
}
for(const name of ['corpus-04','corpus-05']){const item=inputs.find(x=>x.name===name+'-docs-html');inputs.push({...item,name:name+'-docs-ast',mode:'ast'})}
inputs.push({...inputs.find(x=>x.name==='ai-response.md-html'),name:'ai-progressive',mode:'stream'})
const orders=[['baseline','control','candidate'],['candidate','control','baseline']],cpu=[],allocations=[]
for(const input of inputs){
 const inputPath=resolve(directory,input.name+'.input.json');await writeFile(inputPath,JSON.stringify(input));const hashes=new Set()
 for(let round=0;round<orders.length;round++)for(const role of orders[round]){
  const entry=await stage(role)
  const row=JSON.parse(execFileSync(process.execPath,['--expose-gc',program,'--cpu',entry,inputPath,role],{encoding:'utf8',timeout:60000}));hashes.add(row.expected);cpu.push({...row,round});await writeFile(resolve(directory,'partial-cpu.json'),JSON.stringify(cpu))
 }
 assert.equal(hashes.size,1,'Completed output parity: '+input.name)
 if(['corpus-04-docs-ast','corpus-05-docs-ast','ai-response.md-html','prose-heavy.md-ast'].includes(input.name))for(let round=0;round<orders.length;round++)for(const role of orders[round]){
  const file=resolve(directory,allocations.length+'-'+input.name+'-'+role+'.heapprofile.json.gz'),entry=await stage(role)
  const row=JSON.parse(execFileSync(process.execPath,['--expose-gc',program,'--allocation',entry,inputPath,role,file],{encoding:'utf8',timeout:60000}));assert.equal(row.expected,[...hashes][0]);allocations.push({...row,round,file});await writeFile(resolve(directory,'partial-allocations.json'),JSON.stringify(allocations))
 }
}
for(const build of builds)for(const [p,h]of Object.entries(build.hashes))assert.equal(sha(await readFile(resolve(build.entry,'..','dist',p))),h)
for(const[p,h]of Object.entries(sources))assert.equal(sha(await readFile(p)),h);assert.equal(sha(await readFile(program)),programSHA256);assert.equal(sha(await readFile('pnpm-lock.yaml')),lockfileSHA256)
await writeFile(resolve(directory,'receipt.json'),JSON.stringify({baseline,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sources,programSHA256,lockfileSHA256,node:process.version,typescript:require('typescript/package.json').version,builds,cpu,allocations,limitations:'Focused CPU crossover. Exact graph bytes staged at the same absolute module URLs before each fresh child; no runtime mutation while child runs. One workload and one role graph per child. Two mirrored role orders, fixed64MBwarmup and4MBbatches. AST inputs are parsed by their own role outside measurement; source and AST costs are labeled separately. Original frozen role graphs retained. Matching fixed warmup and measurement call counts. Complete UTF8/hash consumption, mirrored role order and raw batch samples. CPU samples and allocation profiles are separate processes. Sampled JS heap includes consumer, excludes native external memory and is not peak/RSS. No production acceptance without unchanged gates.'},null,2))
console.log(JSON.stringify({children:cpu.length,allocationChildren:allocations.length,directory}))
