import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
const root=resolve(process.argv[2]);const roles=['baseline','control','candidate']
const summaries=Object.fromEntries(await Promise.all(roles.map(async role=>[role,JSON.parse(await readFile(resolve(root,role,'summary.json'),'utf8')))])))
const first=summaries.baseline
for(const role of roles){const d=summaries[role];assert.equal(d.rows.length,21);assert.equal(d.programSHA256,first.programSHA256);assert.equal(d.lockfileSHA256,first.lockfileSHA256);assert.equal(d.sourceStable,true);for(const row of d.rows){const b=first.rows.find(r=>r.name===row.name);assert.equal(row.sourceSHA256,b.sourceSHA256);assert.equal(row.outputSHA256,b.outputSHA256);assert.equal(row.streamTraceSHA256,b.streamTraceSHA256);assert.equal(row.allocationIterations,b.allocationIterations)}}
assert.deepEqual(summaries.baseline.sources,summaries.control.sources)
const rows=first.rows.map(row=>({name:row.name,sampledBytesPerOperation:Object.fromEntries(roles.map(role=>[role,summaries[role].rows.find(r=>r.name===row.name).sampledBytesPerOperation]))}))
const result={roles,commits:Object.fromEntries(roles.map(role=>[role,summaries[role].commit])),rows,limitations:'One sequential baseline/control/candidate discovery triplet. Inspector sampled allocation and CPU attribution only. Not throughput, startup, retained heap, RSS or peak memory. No acceptance threshold or broad performance claim. Repeat promising controlled measurements before recommendation.'}
await writeFile(resolve(root,'comparison.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result))
