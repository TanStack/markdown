import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const sha = bytes => createHash('sha256').update(bytes).digest('hex')
if (process.argv[2] === '--child') {
  assert.equal(typeof global.gc, 'function')
  const scenario = JSON.parse(await readFile(process.argv[3], 'utf8'))
  const source = '## Example\n\nOrdinary **safe** prose with [a link](https://example.com).\n\n- First\n- Second\n\n```js\nconst n = 1\n```\n'
  for (let index = 0; index < 2; index++) global.gc()
  const before = process.memoryUsage()
  const started = performance.now()
  const modules = await Promise.all(scenario.paths.map(path => import(pathToFileURL(path).href)))
  const importMs = performance.now() - started
  for (let index = 0; index < 2; index++) global.gc()
  const afterImport = process.memoryUsage()
  const api = modules[0]
  const firstStarted = performance.now()
  const options = { headingIds: false, frontmatter: false, extensions: scenario.group === 'docs' ? (modules[1] ?? api).docsMarkdownExtensions() : [] }
  const value = scenario.group === 'parser' ? JSON.stringify(api.parseMarkdown(source, options)) : api.renderHtml(source, options)
  const bytes = Buffer.from(value, 'utf8')
  const outputSHA256 = sha(bytes)
  const firstCompletedMs = performance.now() - firstStarted
  console.log(JSON.stringify({ importMs, firstCompletedMs, moduleHeapDelta: afterImport.heapUsed - before.heapUsed, before, afterImport, outputBytes: bytes.length, outputSHA256, node: process.version }))
} else {
  const { build, version: esbuildVersion } = await import('esbuild')
  const directory = resolve(process.argv[2])
  await mkdir(directory, { recursive: false })
  const metadataResponse = await fetch('https://registry.npmjs.org/@tanstack%2fmarkdown')
  assert(metadataResponse.ok)
  const metadata = await metadataResponse.json()
  const version = metadata.versions['1.1.1']
  assert(version?.dist?.integrity?.startsWith('sha512-'))
  const response = await fetch(version.dist.tarball)
  assert(response.ok)
  const archive = Buffer.from(await response.arrayBuffer())
  assert.equal('sha512-' + createHash('sha512').update(archive).digest('base64'), version.dist.integrity)
  const archivePath = resolve(directory, 'published.tgz')
  await writeFile(archivePath, archive)
  await mkdir(resolve(directory, 'published'))
  execFileSync('tar', ['-xzf', archivePath, '-C', resolve(directory, 'published')])
  const packageRoot = resolve(directory, 'published/package')
  const pkg = JSON.parse(await readFile(resolve(packageRoot, 'package.json'), 'utf8'))
  assert.equal(pkg.name, '@tanstack/markdown'); assert.equal(pkg.version, '1.1.1')
  const entry = name => resolve(packageRoot, pkg.exports[name].import)
  const groups = { parser: [entry('./parser')], html: [entry('./html')], root: [entry('.')], docs: [entry('.'), entry('./extensions/docs')] }
  const scenarios = []
  const files = {}
  for (const [group, paths] of Object.entries(groups)) {
    const source = 'export * from ' + JSON.stringify(paths[0]) + ';' + (paths[1] ? 'export { docsMarkdownExtensions } from ' + JSON.stringify(paths[1]) + ';' : '')
    const result = await build({ stdin: { contents: source, loader: 'js', resolveDir: process.cwd() }, bundle: true, minify: false, treeShaking: false, platform: 'node', format: 'esm', target: 'node24', write: false, metafile: true })
    const bundle = resolve(directory, group + '-bundled.mjs')
    await writeFile(bundle, result.outputFiles[0].contents)
    for (const path of Object.keys(result.metafile.inputs)) if (path !== '<stdin>') files[path] = sha(await readFile(path))
    await writeFile(resolve(directory, group + '-metafile.json'), JSON.stringify(result.metafile, null, 2))
    for (const variant of ['native', 'control', 'bundled']) {
      const descriptor = { group, variant, paths: variant === 'bundled' ? [bundle] : paths }
      const path = resolve(directory, group + '-' + variant + '.json')
      await writeFile(path, JSON.stringify(descriptor))
      scenarios.push({ ...descriptor, path, bundleSHA256: sha(result.outputFiles[0].contents) })
    }
  }
  const run = scenario => {
    const started = performance.now()
    const result = JSON.parse(execFileSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url), '--child', scenario.path], { encoding: 'utf8', timeout: 30000 }))
    return { group: scenario.group, variant: scenario.variant, processWallMs: performance.now() - started, ...result }
  }
  for (const scenario of scenarios) run(scenario) // Warm only the filesystem cache; every measurement is a fresh process.
  const rows = []
  for (let round = 0; round < 9; round++) {
    for (const scenario of round % 2 ? [...scenarios].reverse() : scenarios) rows.push({ round, ...run(scenario) })
    await writeFile(resolve(directory, 'partial.json'), JSON.stringify(rows, null, 2))
  }
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const summary = []
  for (const group of Object.keys(groups)) {
    const values = rows.filter(row => row.group === group)
    assert.equal(new Set(values.map(row => row.outputSHA256)).size, 1, 'Equivalent completed output within group: ' + group)
    for (const variant of ['native', 'control', 'bundled']) {
      const samples = values.filter(row => row.variant === variant)
      summary.push({ group, variant, samples: samples.length, importMedianMs: median(samples.map(row => row.importMs)), importMinMs: Math.min(...samples.map(row => row.importMs)), importMaxMs: Math.max(...samples.map(row => row.importMs)), firstCompletedMedianMs: median(samples.map(row => row.firstCompletedMs)), moduleHeapMedianBytes: median(samples.map(row => row.moduleHeapDelta)) })
    }
  }
  await writeFile(resolve(directory, 'receipt.json'), JSON.stringify({ package: pkg.name, version: pkg.version, integrity: version.dist.integrity, tarballSHA256: sha(archive), programSHA256: sha(await readFile(fileURLToPath(import.meta.url))), commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), node: process.version, versions: process.versions, platform: process.platform, arch: process.arch, cpu: (await import('node:os')).cpus()[0].model, esbuildVersion, files, scenarios, summary, rows, limitations: 'Exploratory cold-process module initialization on warm filesystem cache. Identical native controls, mirrored order, actual published artifact versus non-minified tree-shaking-disabled bundles. Import excludes process creation; process wall time includes harness/GC. First completed work includes serialization/UTF8/hash. Groups have different work and must not be ranked against one another. Not browser/cold-disk startup, throughput, sampled allocation or peak memory, and no packaging candidate is accepted.' }, null, 2))
  console.log(JSON.stringify(summary))
}
