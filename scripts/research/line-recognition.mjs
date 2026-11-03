import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile,writeFile,mkdir,readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL,fileURLToPath } from 'node:url'
const sha=x=>createHash('sha256').update(x).digest('hex'),baseline='2fe93336be299082ac935a5aaf76c358168942ce',directory=resolve('artifacts/line-recognition')
await mkdir(directory,{recursive:true})
const original=execFileSync('git',['show',baseline+':src/parser.ts'],{encoding:'utf8'})
let instrumented=original
function replace(before,after,count=1){assert.equal(instrumented.split(before).length-1,count,before);instrumented=instrumented.replaceAll(before,after)}
replace('  let cursor = 0','  const probeContext = (globalThis as any).__listProbe.register(inputLines)\n  let cursor = 0')
replace('const first = listMarker(current())',"const first = probeListMarker(probeContext, cursor, current(), 'list-first')")
replace('const marker = listMarker(current())',"const marker = probeListMarker(probeContext, cursor, current(), 'list-item')")
replace('const nextMarker = listMarker(line)',"const nextMarker = probeListMarker(probeContext, cursor, line, 'list-next')")
replace('const followingMarker = listMarker(following)',"const followingMarker = probeListMarker(probeContext, nextIndex, following, 'list-after-blank')")
replace('isBlockStart(line, next())','isBlockStart(line, next(), probeContext, cursor)',3)
replace('function isBlockStart(line: string, next?: string): boolean {','function isBlockStart(line: string, next?: string, probeContext?: number, probeIndex?: number): boolean {')
replace('  const marker = listMarker(line)',"  const marker = probeListMarker(probeContext!, probeIndex!, line, 'block-start')")
instrumented+=`\nfunction probeListMarker(context: number, index: number, line: string, site: string) {\n const result = listMarker(line)\n ;(globalThis as any).__listProbe.marker(context, index, line, site, result !== undefined)\n return result\n}\n`
const require=createRequire(import.meta.url),compiler=require.resolve('typescript/bin/tsc'),apis=[],builds=[]
for(const role of ['baseline','instrumented']){
 const root=resolve(directory,role);await mkdir(root)
 execFileSync('tar',['-x','-C',root],{input:execFileSync('git',['archive',baseline,'src','package.json','tsconfig.json','tsconfig.build.json'])})
 if(role==='instrumented')await writeFile(resolve(root,'src/parser.ts'),instrumented)
 execFileSync(process.execPath,[compiler,'-p',resolve(root,'tsconfig.build.json')],{stdio:'inherit'})
 const hashes=Object.fromEntries(await Promise.all((await readdir(resolve(root,'dist'),{recursive:true})).filter(x=>x.endsWith('.js')).sort().map(async p=>[p,sha(await readFile(resolve(root,'dist',p)))])))
 builds.push({role,hashes});apis.push({...await import(pathToFileURL(resolve(root,'dist/index.js'))),...await import(pathToFileURL(resolve(root,'dist/extensions/docs.js')))})
}
let contexts=[],events=[]
globalThis.__listProbe={register(lines){const id=contexts.length;contexts.push({id,lines:lines.length,bytes:Buffer.byteLength(lines.join('\n'))});return id},marker(context,index,line,site,success){assert.ok(contexts[context]);assert.ok(index>=0&&index<contexts[context].lines);events.push({context,index,sha256:sha(line),chars:line.length,site,success})}}
const selection=JSON.parse(await readFile('scripts/research/corpus-selection.json','utf8')),fixtures=[]
for(const item of selection){const response=await fetch('https://raw.githubusercontent.com/'+item.github+'/'+item.commit+'/'+item.path.split('/').map(encodeURIComponent).join('/'));assert.ok(response.ok);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(sha(bytes),item.sha256);fixtures.push({...item,name:item.id,source:bytes.toString('utf8')})}
for(const name of ['small-doc.md','prose-heavy.md','code-heavy.md','tables-lists.md','malformed.md','ai-response.md']){const source=await readFile('fixtures/benchmark/'+name,'utf8');fixtures.push({name,source,sha256:sha(source)})}
const rows=[]
function options(api,profile){return profile==='docs'?{allowHtml:true,headingIds:false,extensions:api.docsMarkdownExtensions()}: {}}
for(const fixture of fixtures)for(const profile of ['core','docs']){
 contexts=[];events=[]
 const opts=apis.map(api=>options(api,profile)),ast=apis.map((api,i)=>api.parseMarkdown(fixture.source,opts[i]));assert.deepEqual(ast[1],ast[0])
 const html=apis.map((api,i)=>api.renderHtml(ast[i],opts[i]));assert.equal(html[1],html[0])
 const counts=new Map()
 for(const event of events){const key=event.context+':'+event.index+':'+event.sha256;const row=counts.get(key)??{...event,calls:0,sites:{}};row.calls++;row.sites[event.site]=(row.sites[event.site]??0)+1;counts.set(key,row)}
 const perIndex=new Map();for(const event of events){const key=event.context+':'+event.index;const values=perIndex.get(key)??new Set();values.add(event.sha256);perIndex.set(key,values)}
 const summary={name:fixture.name,profile,sourceBytes:Buffer.byteLength(fixture.source),contexts:contexts.length,contextLines:contexts.reduce((n,r)=>n+r.lines,0),calls:events.length,uniqueContextLineValues:counts.size,duplicateCalls:events.length-counts.size,successfulCalls:events.filter(r=>r.success).length,duplicateSuccessfulCalls:[...counts.values()].filter(r=>r.success).reduce((n,r)=>n+r.calls-1,0),revisedContextLines:[...perIndex.values()].filter(s=>s.size>1).length,bySite:Object.fromEntries([...new Set(events.map(r=>r.site))].sort().map(s=>[s,events.filter(r=>r.site===s).length])),outputSHA256:sha(html[0]),astSHA256:sha(JSON.stringify(ast[0]))}
 rows.push(summary);await writeFile(resolve(directory,fixture.name+'-'+profile+'.json'),JSON.stringify({summary,contexts,events,recognized:[...counts.values()]},null,2))
}
let spec=0
for(const example of require('commonmark-spec').tests){contexts=[];events=[];const opts=apis.map(api=>({allowHtml:true,headingIds:false}));assert.equal(apis[1].renderHtml(example.markdown,opts[1]),apis[0].renderHtml(example.markdown,opts[0]));spec++}
await writeFile(resolve(directory,'receipt.json'),JSON.stringify({baseline,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),programSHA256:sha(await readFile(fileURLToPath(import.meta.url))),lockfileSHA256:sha(await readFile('pnpm-lock.yaml')),originalParserSHA256:sha(original),instrumentedParserSHA256:sha(instrumented),builds,node:process.version,typescript:require('typescript/package.json').version,spec,rows,inputs:fixtures.map(({source,...rest})=>rest),limitations:'Count-only instrumented parser, never throughput/allocation evidence. Context index plus line hash distinguishes mutations. Duplicate recognition is a maximum avoidable-call opportunity, not a measured cache speedup. Nested contexts are separate. No production source changed.'},null,2))
console.log(JSON.stringify(rows,null,2))
