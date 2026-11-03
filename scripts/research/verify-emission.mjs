import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFile,writeFile,mkdir,readdir,copyFile} from 'node:fs/promises'
import {resolve,join,dirname} from 'node:path'
import {execFileSync} from 'node:child_process'
const sha=b=>createHash('sha256').update(b).digest('hex')
const root=resolve('artifacts/emission-identity');await mkdir(root,{recursive:true})
const expected='sha512-8ZaMDLvp7iUuo7R5Ot+yvX/h1ZN8Cq2p38iL+X9uOkIKVFw3IjgP62dXT6+dp/Nk522qsuSDCJNdt2F4fZvVXQ=='
const response=await fetch('https://registry.npmjs.org/@tanstack%2fmarkdown/1.2.0');assert.ok(response.ok);const metadata=await response.json();assert.equal(metadata.dist.integrity,expected)
const archiveResponse=await fetch(metadata.dist.tarball);assert.ok(archiveResponse.ok);const bytes=Buffer.from(await archiveResponse.arrayBuffer());assert.equal('sha512-'+createHash('sha512').update(bytes).digest('base64'),expected);await writeFile(join(root,'actual.tgz'),bytes)
execFileSync('python3',['-c','import tarfile,sys; tarfile.open(sys.argv[1]).extractall(sys.argv[2],filter="data")',join(root,'actual.tgz'),root])
const actual=(await readdir(join(root,'package/dist'),{recursive:true})).filter(x=>x.endsWith('.js')).sort(),built=(await readdir('dist',{recursive:true})).filter(x=>x.endsWith('.js')).sort();assert.deepEqual(built,actual)
const modules={};for(const name of built){const emitted=await readFile(join('dist',name)),original=await readFile(join(root,'package/dist',name));assert.deepEqual(emitted,original,'Actual published JS identity: '+name);modules[name]=sha(emitted);await mkdir(dirname(join(root,'profiled',name)),{recursive:true});await copyFile(join('dist',name),join(root,'profiled',name))}
assert.ok(!(await readFile('dist/parser.js','utf8')).includes('__name'))
await writeFile(join(root,'receipt.json'),JSON.stringify({version:'1.2.0',integrity:expected,modules,node:process.version,compiler:JSON.parse(await readFile('node_modules/typescript/package.json','utf8')).version,sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),note:'Every native JavaScript module byte-identical to verified published artifact. No independent provenance signature verification claimed.'},null,2));console.log(JSON.stringify({modules:built.length,version:'1.2.0',identity:true}))
