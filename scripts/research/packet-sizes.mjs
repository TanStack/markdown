import {entries,publicEntries} from '../measure-size.ts'
import {build} from 'esbuild'
import {readFile,writeFile,mkdir} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
import {gzipSync,brotliCompressSync} from 'node:zlib'
import {createHash} from 'node:crypto'
const directory=resolve('artifacts/list-marker-packet');await mkdir(directory,{recursive:true})
const archive=execFileSync('pnpm',['pack','--pack-destination',directory],{encoding:'utf8'});const {readdir}=await import('node:fs/promises');const file=(await readdir(directory)).find(x=>x.endsWith('.tgz'));await mkdir(resolve(directory,'unpacked'));execFileSync('tar',['-xf',resolve(directory,file),'-C',resolve(directory,'unpacked')])
const rows=[]
for(const entry of [...entries.filter(x=>x.group==='tanstack'),...publicEntries]){
 const result=await build({stdin:{contents:entry.contents,resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,minify:true,treeShaking:true,platform:'browser',format:'esm',target:'es2022',external:entry.external??[],logLevel:'silent'}),bytes=result.outputFiles[0].contents
 rows.push({group:entry.group,name:entry.name,min:bytes.length,gzip:gzipSync(bytes,{level:9}).length,brotli:brotliCompressSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')})
 await writeFile(resolve(directory,'bundle-'+rows.length+'.js'),bytes)
}
const packed=await build({stdin:{contents:"import * as entry from './artifacts/list-marker-packet/unpacked/package/dist/html/streaming.js'; console.log(entry)",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,minify:true,treeShaking:true,platform:'browser',format:'esm',target:'es2022',external:['react','octane'],logLevel:'silent'}),bytes=packed.outputFiles[0].contents;await writeFile(resolve(directory,'packed-streaming.js'),bytes)
await writeFile(resolve(directory,'sizes.json'),JSON.stringify({node:process.version,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),archive,archiveSHA256:createHash('sha256').update(await readFile(resolve(directory,file))).digest('hex'),rows,packedStreaming:{min:bytes.length,gzip:gzipSync(bytes,{level:9}).length,brotli:brotliCompressSync(bytes).length,sha256:createHash('sha256').update(bytes).digest('hex')}},null,2))
