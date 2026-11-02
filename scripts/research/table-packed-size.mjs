import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { build } from 'esbuild'
const root=resolve('artifacts/compiled-sizes');await mkdir(root,{recursive:true})
const response=await fetch('https://registry.npmjs.org/@tanstack%2fmarkdown/1.2.0');assert.ok(response.ok);const metadata=await response.json();assert.equal(metadata.dist.integrity,'sha512-8ZaMDLvp7iUuo7R5Ot+yvX/h1ZN8Cq2p38iL+X9uOkIKVFw3IjgP62dXT6+dp/Nk522qsuSDCJNdt2F4fZvVXQ==')
const archiveResponse=await fetch(metadata.dist.tarball);assert.ok(archiveResponse.ok);const archive=Buffer.from(await archiveResponse.arrayBuffer());assert.equal('sha512-'+createHash('sha512').update(archive).digest('base64'),metadata.dist.integrity);await writeFile(join(root,'baseline.tgz'),archive);execFileSync('python3',['-c','import tarfile,sys; tarfile.open(sys.argv[1]).extractall(sys.argv[2],filter="data")',join(root,'baseline.tgz'),root])
const manifest=JSON.parse(await readFile('package.json','utf8')),rows=[]
for(const[name,entry]of Object.entries(manifest.exports)){
 const values=[]
 for(const directory of [join(root,'package'),process.cwd()]){
  const result=await build({stdin:{contents:`import * as entry from ${JSON.stringify(resolve(directory,entry.import))}; console.log(entry)`,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,minify:true,treeShaking:true,platform:'browser',format:'esm',target:'es2022',external:['react','octane'],logLevel:'silent'})
  const bytes=result.outputFiles[0].contents;values.push({min:bytes.length,gzip:gzipSync(bytes,{level:9}).length,brotli:brotliCompressSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')})
 }
 rows.push({name,before:values[0],after:values[1]})
}
await writeFile(join(root,'receipt.json'),JSON.stringify({node:process.version,baselineVersion:'1.2.0',baselineIntegrity:metadata.dist.integrity,rows,limitations:'Compiled actual1.2.0 baseline versus exact candidate build with the same bundler/compressor. Existing source-based budgets stay authoritative; new HTML streaming namespace has a separate compiled budget as well. No baseline misses waived.'},null,2));console.log(JSON.stringify(rows))
