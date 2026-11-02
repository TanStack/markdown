import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile, mkdtemp, symlink } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { build } from 'esbuild'
const release = 'ca59f585e292a4788cacb95e9729a2b9a4850d59'
const output = resolve('artifacts/published-1.2.0-node' + process.versions.node.split('.')[0])
await mkdir(output, { recursive: true })
const sha = (data, algorithm = 'sha256', encoding = 'hex') => createHash(algorithm).update(data).digest(encoding)
async function get(url) { const response = await fetch(url); assert.ok(response.ok, `${url}: ${response.status}`); return response }
async function download(version) {
  let response = await fetch('https://registry.npmjs.org/@tanstack%2fmarkdown/' + version)
  const metadata = response.ok ? await response.json() : (await (await get('https://registry.npmjs.org/@tanstack%2fmarkdown')).json()).versions[version]
  assert.equal(metadata.version, version)
  assert.ok(metadata.dist.tarball.startsWith('https://registry.npmjs.org/'))
  const archive = Buffer.from(await (await get(metadata.dist.tarball)).arrayBuffer())
  assert.equal('sha512-' + sha(archive, 'sha512', 'base64'), metadata.dist.integrity)
  if (version === '1.1.1') assert.equal(metadata.dist.integrity, 'sha512-611nn7ontZtoUDELqfDE5zXxg38ydhkqM/T3p19HpgpMQyjB1VnYndSfR+4WFCEXhfy4gBAEdzVOS/SELiIkJg==')
  const directory = join(output, version)
  await mkdir(directory)
  await writeFile(join(directory, 'metadata.json'), JSON.stringify(metadata, null, 2))
  await writeFile(join(directory, 'archive.tgz'), archive)
  execFileSync('python3', ['-c', 'import tarfile,sys; tarfile.open(sys.argv[1]).extractall(sys.argv[2],filter="data")', join(directory, 'archive.tgz'), directory])
  return { metadata, archive, directory, package: join(directory, 'package') }
}
const previous = await download('1.1.1'), actual = await download('1.2.0')
assert.equal(sha(await readFile('src/html/streaming.ts')), '2604cf0aa9e2e5571fdf67e37922f0bd9707c21bfb6d6ad15f93a5548a2b5c3f')
assert.equal(sha(await readFile(join(actual.package, 'dist/html/streaming.js'))), '4a2fd382d5cd64595e8b64fbead39cb4ee64399a0f9c5e6ecf167ce9d2e04573')
async function hashes(directory, prefix = '') {
  const result = {}
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name), name = prefix + entry.name
    if (entry.isDirectory()) Object.assign(result, await hashes(path, name + '/'))
    else result[name] = sha(await readFile(path))
  }
  return result
}
const oldHashes = await hashes(join(previous.package, 'dist')), newHashes = await hashes(join(actual.package, 'dist'))
for (const [name, hash] of Object.entries(oldHashes)) assert.equal(newHashes[name], hash, name)
assert.deepEqual(Object.keys(newHashes).filter(name => !(name in oldHashes)).sort(), ['html/streaming.d.ts', 'html/streaming.d.ts.map', 'html/streaming.js'])
const manifest = JSON.parse(await readFile(join(actual.package, 'package.json'), 'utf8'))
const oldManifest = JSON.parse(await readFile(join(previous.package, 'package.json'), 'utf8'))
for (const [name, entry] of Object.entries(oldManifest.exports)) assert.deepEqual(manifest.exports[name], entry)
assert.equal(manifest.version, '1.2.0')
assert.deepEqual(manifest.exports['./html/streaming'], { types: './dist/html/streaming.d.ts', import: './dist/html/streaming.js' })
assert.equal(Object.keys(manifest.exports).length, Object.keys(oldManifest.exports).length + 1)
const attestations = await (await get(actual.metadata.dist.attestations.url)).json()
await writeFile(join(output, 'attestations.json'), JSON.stringify(attestations, null, 2))
const statement = attestations.attestations.filter(row => row.predicateType === 'https://slsa.dev/provenance/v1').map(row => JSON.parse(Buffer.from(row.bundle.dsseEnvelope.payload, 'base64').toString('utf8')))[0]
assert.ok(statement.subject.some(row => row.name === 'pkg:npm/%40tanstack/markdown@1.2.0' && row.digest.sha512 === sha(actual.archive, 'sha512')))
const definition = statement.predicate.buildDefinition
assert.deepEqual(definition.externalParameters.workflow, { ref: 'refs/heads/main', repository: 'https://github.com/TanStack/markdown', path: '.github/workflows/release.yml' })
assert.ok(definition.resolvedDependencies.some(row => row.uri === 'git+https://github.com/TanStack/markdown@refs/heads/main' && row.digest.gitCommit === release))
const consumer = await mkdtemp(join(tmpdir(), 'published-markdown-'))
await mkdir(join(consumer, 'node_modules/@tanstack'), { recursive: true })
await symlink(actual.package, join(consumer, 'node_modules/@tanstack/markdown'))
await writeFile(join(consumer, 'package.json'), '{"private":true,"type":"module"}')
await writeFile(join(consumer, 'verify.mjs'), `
import assert from 'node:assert/strict'
import { createStreamingHtmlRenderer } from '@tanstack/markdown/html/streaming'
import { parseMarkdown, renderHtml } from '@tanstack/markdown'
import { streamingMarkdownExtension } from '@tanstack/markdown/extensions/streaming'
let comparisons = 0
for (const source of ${JSON.stringify(['```text\nα😀<&\n```\n\n[bad](javascript:alert(1))', '# Answer\n\n[ref]\n\n[ref]: /late', '~~~~text\nline\n~~~\nend', '```\r\nline\r\n```'])}) {
 const renderer = createStreamingHtmlRenderer()
 for(let end=0;end<=source.length;end++){const input=source.slice(0,end);assert.equal(renderer.render(input),renderHtml(input,{extensions:[streamingMarkdownExtension()]}));comparisons++}
 renderer.reset();assert.equal(renderer.render(source),renderHtml(source,{extensions:[streamingMarkdownExtension()]}))
 const ast=parseMarkdown('# Document');assert.equal(renderer.render(ast),renderHtml(ast))
}
const renderer=createStreamingHtmlRenderer();let captured
renderer.render('capture',{extensions:[{name:'capture',transformDocument(document,context){captured=context.options.extensions[0]}}]})
captured.renderHtml=node=>node.type==='code'?'<pre>delegate</pre>':undefined
assert.equal(renderer.render('\\x60\\x60\\x60text\\nalpha'),'<pre>delegate</pre>');renderer.reset();assert.equal(renderer.render('\\x60\\x60\\x60text\\nalpha beta'),'<pre>delegate</pre>')
console.log(JSON.stringify({comparisons,completePrefixOutput:true,astAndReset:true,mutableDelegateAfterReset:true}))
`)
const runtime = JSON.parse(execFileSync(process.execPath, [join(consumer, 'verify.mjs')], { cwd: consumer, encoding: 'utf8' }))
await writeFile(join(consumer, 'verify.ts'), `import {createStreamingHtmlRenderer,type StreamingHtmlRenderer} from '@tanstack/markdown/html/streaming';import {parseMarkdown,type MarkdownDocument} from '@tanstack/markdown';const renderer:StreamingHtmlRenderer=createStreamingHtmlRenderer();const document:MarkdownDocument=parseMarkdown('# Typed');const html:string=renderer.render(document,{allowHtml:false});renderer.reset();renderer.render('next');void html;`)
execFileSync(process.execPath, [resolve('node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', join(consumer, 'verify.ts')], { cwd: consumer, stdio: 'inherit' })
const result = await build({ stdin: { contents: "import * as entry from '@tanstack/markdown/html/streaming'; console.log(entry)", resolveDir: consumer, loader: 'ts' }, bundle: true, write: false, minify: true, treeShaking: true, platform: 'browser', format: 'esm', target: 'es2022', external: ['react', 'octane'], logLevel: 'silent' })
const bytes = result.outputFiles[0].contents, size = { min: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length, brotli: brotliCompressSync(bytes).length }
assert.ok(size.min <= 19605 && size.gzip <= 7694 && size.brotli <= 7083, JSON.stringify(size))
const receipt = { version: '1.2.0', releaseCommit: release, node: process.version, programSHA256: sha(await readFile(new URL(import.meta.url))), sourceSHA256: sha(await readFile('src/html/streaming.ts')), newJavaScriptMatchesMeasuredSource: true, integrity: actual.metadata.dist.integrity, oldIntegrity: previous.metadata.dist.integrity, unchangedPreviousCompiledFiles: Object.keys(oldHashes).length, oldExportsUnchanged: true, distSHA256: newHashes, runtime, publicEntryStrictTypeScript: true, packedNamespace: size, provenanceInvocation: statement.predicate.runDetails.metadata.invocationId, provenanceCheck: 'Registry envelope payload subject, workflow and release commit cross-checked; signature not independently verified', verifiedAt: new Date().toISOString() }
await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2))
console.log(JSON.stringify(receipt, null, 2))
