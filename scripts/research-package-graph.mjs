import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { build, version as esbuildVersion } from 'esbuild'
import { entries, publicEntries } from './measure-size.ts'
import { runEquivalence } from './package-graph-equivalence.mjs'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
const directory = resolve(process.argv[2])
async function files(root, prefix = '') {
  const result = {}
  for (const item of await readdir(resolve(root, prefix), { withFileTypes: true })) {
    const name = prefix + item.name
    if (item.isDirectory()) Object.assign(result, await files(root, name + '/'))
    else result[name] = await readFile(resolve(root, name))
  }
  return result
}
async function main() {
  await mkdir(directory, { recursive: false })
  const response = await fetch('https://registry.npmjs.org/@tanstack%2fmarkdown'); assert(response.ok)
  const version = (await response.json()).versions['1.1.1']
  const tarResponse = await fetch(version.dist.tarball); assert(tarResponse.ok)
  const archive = Buffer.from(await tarResponse.arrayBuffer())
  assert.equal('sha512-' + createHash('sha512').update(archive).digest('base64'), version.dist.integrity)
  await writeFile(resolve(directory, 'published.tgz'), archive)
  await mkdir(resolve(directory, 'native'))
  execFileSync('tar', ['-xzf', resolve(directory, 'published.tgz'), '-C', resolve(directory, 'native')])
  const native = resolve(directory, 'native/package'), candidate = resolve(directory, 'candidate/package')
  await cp(native, candidate, { recursive: true })
  const pkg = JSON.parse(await readFile(resolve(native, 'package.json'), 'utf8'))
  assert.equal(pkg.name, '@tanstack/markdown'); assert.equal(pkg.version, '1.1.1')
  const entry = (root, name) => resolve(root, pkg.exports[name].import)
  const originalFiles = await files(native)
  assert(!Object.keys(originalFiles).some(name => name.endsWith('.js.map')), 'Need an explicit source-map design if JS maps are present')
  for (const name of Object.keys(originalFiles).filter(name => name.startsWith('dist/') && name.endsWith('.js'))) await rm(resolve(candidate, name))
  const entryPoints = Object.fromEntries(Object.keys(pkg.exports).map(name => [pkg.exports[name].import.slice('./dist/'.length, -3), entry(native, name)]))
  const generate = outdir => build({ entryPoints, outdir, outbase: resolve(native, 'dist'), bundle: true, splitting: true, minify: false, treeShaking: false, platform: 'neutral', format: 'esm', target: 'es2022', external: ['react', 'octane'], chunkNames: 'chunks/[name]-[hash]', write: false, metafile: true })
  const generated = await generate(resolve(candidate, 'dist'))
  for (const file of generated.outputFiles) { await mkdir(resolve(file.path, '..'), { recursive: true }); await writeFile(file.path, file.contents) }
  const repeatRoot = resolve(directory, 'repeat-dist'), repeated = await generate(repeatRoot)
  const firstHashes = Object.fromEntries(generated.outputFiles.map(file => [relative(resolve(candidate, 'dist'), file.path), sha(file.contents)]))
  const repeatedHashes = Object.fromEntries(repeated.outputFiles.map(file => [relative(repeatRoot, file.path), sha(file.contents)]))
  assert.deepEqual(repeatedHashes, firstHashes, 'Generated distribution must be deterministic')
  await writeFile(resolve(directory, 'graph-metafile.json'), JSON.stringify(generated.metafile, null, 2))
  const candidateFiles = await files(candidate)
  for (const [name, bytes] of Object.entries(originalFiles).filter(([name]) => !name.endsWith('.js'))) assert.equal(sha(candidateFiles[name]), sha(bytes), name)
  const modules = []
  for (const root of [native, candidate]) modules.push(Object.fromEntries(await Promise.all(Object.keys(pkg.exports).map(async name => [name, await import(pathToFileURL(entry(root, name)).href)]))))
  const namespaceDifferences = [], functionMetadataDifferences = [], aliasDifferences = []
  const bindings = []
  for (const name of Object.keys(pkg.exports)) {
    const left = modules[0][name], right = modules[1][name]
    if (JSON.stringify(Object.keys(left)) !== JSON.stringify(Object.keys(right))) namespaceDifferences.push(name)
    for (const key of Object.keys(left)) {
      if (typeof left[key] !== typeof right[key]) namespaceDifferences.push(name + ':' + key)
      if (typeof left[key] === 'function') {
        bindings.push([name, key])
        if (left[key].name !== right[key].name || left[key].length !== right[key].length) functionMetadataDifferences.push({ entry: name, key, before: [left[key].name, left[key].length], after: [right[key].name, right[key].length] })
      }
    }
  }
  for (let a = 0; a < bindings.length; a++) for (let b = a + 1; b < bindings.length; b++) {
    const [ae, ak] = bindings[a], [be, bk] = bindings[b]
    if ((modules[0][ae][ak] === modules[0][be][bk]) !== (modules[1][ae][ak] === modules[1][be][bk])) aliasDifferences.push([bindings[a], bindings[b]])
  }
  const apis = modules.map(modules => ({ ...modules['.'], ...modules['./extensions/docs'], ...modules['./extensions/streaming'] }))
  const comparisons = await runEquivalence(apis)
  const budgetText = await readFile('tests/bundle-size.test.ts', 'utf8')
  const publicBudgets = Object.fromEntries([...budgetText.matchAll(/'([^']+)': \[(\d+), (\d+), (\d+)\]/g)].map(match => [match[1], match.slice(2).map(Number)]))
  const variables = { parser: 'parser only', html: 'html renderer no highlighter', react: 'react adapter', octane: 'octane adapter', pluggable: 'html renderer with external highlighter stub', streaming: 'streaming extension', callouts: 'callouts extension', reactStreaming: 'react adapter with streaming extension', docs: 'docs extension preset', tabs: 'tabs transforms' }
  const selectedBudgets = Object.fromEntries([...budgetText.matchAll(/\[(\w+), (\d+), (\d+), (\d+)\]/g)].filter(match => variables[match[1]]).map(match => [variables[match[1]], match.slice(2).map(Number)]))
  assert.equal(Object.keys(publicBudgets).length, 13); assert.equal(Object.keys(selectedBudgets).length, 10)
  const cases = [...entries.filter(value => value.group === 'tanstack').map(value => ({ ...value, budget: selectedBudgets[value.name] })), ...publicEntries.map(value => ({ ...value, budget: publicBudgets[value.name] })), { name: 'aggregate root+docs', contents: "import * as root from './src/index.ts'; import * as docs from './src/extensions/docs.ts'; console.log(root, docs)" }, { name: 'aggregate HTML+docs', contents: "import {renderHtml} from './src/html.ts'; import {docsMarkdownExtensions} from './src/extensions/docs.ts'; console.log(renderHtml,docsMarkdownExtensions)" }, { name: 'aggregate all entries', contents: publicEntries.map((value, index) => value.contents.replaceAll('entry', 'entry' + index)).join('\n') }]
  const sizes = []
  for (const test of cases) {
    const values = []
    for (const root of [native, candidate]) {
      const result = await build({ stdin: { contents: test.contents, resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, minify: true, treeShaking: true, platform: 'browser', format: 'esm', target: 'es2022', external: ['react', 'octane'], metafile: true, plugins: [{ name: 'actual-distribution', setup(builder) { builder.onResolve({ filter: /^\.\/src\/.+\.ts$/ }, ({ path }) => ({ path: resolve(root, 'dist', path.slice('./src/'.length, -3) + '.js') })) } }] })
      const bytes = result.outputFiles[0].contents
      values.push({ min: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length, brotli: brotliCompressSync(bytes).length, bundleSHA256: sha(bytes), ownGraphInputs: Object.keys(result.metafile.inputs).filter(path => resolve(path).startsWith(root + '/')) })
    }
    sizes.push({ name: test.name, budget: test.budget, before: values[0], after: values[1] })
  }
  const baselineBudgetFailures = [], candidateBudgetFailures = []
  for (const row of sizes.filter(row => row.budget)) for (const [index, key] of ['min', 'gzip', 'brotli'].entries()) {
    if (row.before[key] > row.budget[index]) baselineBudgetFailures.push({ name: row.name, metric: key, bytes: row.before[key], budget: row.budget[index] })
    if (row.after[key] > row.budget[index]) candidateBudgetFailures.push({ name: row.name, metric: key, bytes: row.after[key], budget: row.budget[index] })
  }
  const packing = []
  for (const [name, root] of [['native', native], ['candidate', candidate]]) {
    const tar = execFileSync('tar', ['--sort=name', '--mtime=@0', '--owner=0', '--group=0', '--numeric-owner', '-cf', '-', '-C', resolve(root, '..'), 'package'], { maxBuffer: 10 * 1024 * 1024 })
    const compressed = gzipSync(tar, { level: 9 }); await writeFile(resolve(directory, name + '-repacked.tgz'), compressed)
    const values = name === 'native' ? originalFiles : candidateFiles
    packing.push({ name, unpackedBytes: Object.values(values).reduce((sum, bytes) => sum + bytes.length, 0), files: Object.keys(values).length, jsFiles: Object.keys(values).filter(name => name.endsWith('.js')).length, tarBytes: tar.length, gzipBytes: compressed.length, sha256: sha(compressed) })
  }
  const receipt = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), programSHA256: sha(await readFile(fileURLToPath(import.meta.url))), budgetSHA256: sha(Buffer.from(budgetText)), node: process.version, versions: process.versions, esbuildVersion, package: pkg.name, version: pkg.version, integrity: version.dist.integrity, tarballSHA256: sha(archive), originalFiles: Object.fromEntries(Object.entries(originalFiles).map(([name, bytes]) => [name, sha(bytes)])), candidateFiles: Object.fromEntries(Object.entries(candidateFiles).map(([name, bytes]) => [name, sha(bytes)])), deterministicOutputHashes: firstHashes, comparisons, namespaceDifferences, functionMetadataDifferences, aliasDifferences, baselineBudgetFailures, candidateBudgetFailures, packing, sizes, firstGatePass: !namespaceDifferences.length && !functionMetadataDifferences.length && !aliasDifferences.length && !baselineBudgetFailures.length && !candidateBudgetFailures.length, limitations: 'Temporary actual distribution graph only. No runtime/build source change, startup measurement, type consumer/corpus/CI/release acceptance. Existing budgets measured against actual package JS and baseline failures retained. Extra aggregates/archives have no invented budget. Independent consumer bundles are measured whole, never added together.' }
  await writeFile(resolve(directory, 'receipt.json'), JSON.stringify(receipt, null, 2))
  console.log(JSON.stringify({ firstGatePass: receipt.firstGatePass, comparisons, namespaceDifferences, functionMetadataDifferences, aliasDifferences, baselineBudgetFailures, candidateBudgetFailures, packing }))
}
await main().catch(async error => { await writeFile(resolve(directory, 'error.json'), JSON.stringify({ message: error.message, stack: error.stack }, null, 2)).catch(() => {}); throw error })
