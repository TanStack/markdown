import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { build } from 'esbuild'
import { normalizeConformanceHtml } from './conformance-data.ts'
import { entries, publicEntries } from './measure-size.ts'
import { compareRenderedHtml, stripFrontmatter } from './audit-corpus.ts'
import { marked } from 'marked'

// Compare both revisions with the same compiler, runtime, fixtures, and process.
const root = process.cwd()
const revision = process.argv[2]
assert(revision, 'Usage: node --import tsx scripts/compare-revision.mjs <baseline-git-ref-or-directory> [--no-bench] [--corpus]')
const directory = await stat(revision).then(value => value.isDirectory()).catch(() => false)
const baseline = directory ? resolve(revision) : execFileSync('git', ['rev-parse', '--verify', `${revision}^{commit}`], { encoding: 'utf8' }).trim()
const sourceCache = new Map()
const baselinePlugin = {
  name: 'baseline-source',
  setup(builder) {
    builder.onLoad({ filter: /\.ts$/ }, async ({ path }) => {
      const name = relative(root, path).replaceAll('\\', '/')
      if (!name.startsWith('src/')) return
      if (!sourceCache.has(name)) {
        sourceCache.set(name, directory ? await readFile(resolve(baseline, name), 'utf8') : execFileSync('git', ['show', `${baseline}:${name}`], { encoding: 'utf8' }))
      }
      return { contents: sourceCache.get(name), loader: 'ts' }
    })
  },
}

async function bundle(contents, previous, external = [], format = 'esm') {
  const result = await build({
    stdin: { contents, resolveDir: root, loader: 'ts' },
    bundle: true,
    write: false,
    minify: true,
    treeShaking: true,
    platform: 'browser',
    format,
    target: 'es2022',
    external,
    plugins: previous ? [baselinePlugin] : [],
    logLevel: 'silent',
  })
  return result.outputFiles[0].contents
}

const sizes = []
for (const entry of [...entries.filter(entry => entry.group === 'tanstack'), ...publicEntries]) {
  const results = []
  for (const previous of [true, false]) {
    const code = await bundle(entry.contents, previous, entry.external)
    results.push({ min: code.length, gzip: gzipSync(code, { level: 9 }).length, brotli: brotliCompressSync(code).length })
  }
  sizes.push({ name: entry.name, before: results[0], after: results[1] })
}
console.table(sizes.map(row => ({ name: row.name, before: row.before.gzip, after: row.after.gzip, delta: row.after.gzip - row.before.gzip })))

const apis = []
for (const previous of [true, false]) {
  const code = await bundle("export * from './src/index.ts'; export * from './src/extensions/streaming.ts'; export * from './src/extensions/docs.ts'", previous)
  apis.push(await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}#${previous}`))
}
const require = createRequire(import.meta.url)
const passing = apis.map(api => require('commonmark-spec').tests.filter(example =>
  normalizeConformanceHtml(api.renderHtml(example.markdown, { allowHtml: true, headingIds: false })) === normalizeConformanceHtml(example.html),
).map(example => example.number))
const compatibility = {
  before: passing[0].length,
  after: passing[1].length,
  gained: passing[1].filter(number => !passing[0].includes(number)),
  lost: passing[0].filter(number => !passing[1].includes(number)),
}
console.log('CommonMark:', compatibility)

const fixtures = []
for (const name of (await readdir('fixtures/benchmark')).filter(name => name.endsWith('.md')).sort()) {
  fixtures.push({ name, source: await readFile(`fixtures/benchmark/${name}`, 'utf8') })
}
fixtures.push({ name: 'long-prose', source: 'Ordinary prose with words and punctuation, without inline markup. '.repeat(1000) })
fixtures.push({ name: 'unmatched-brackets', source: '['.repeat(32000) })
let sink = 0
function sample(run, iterations) {
  const start = performance.now()
  for (let index = 0; index < iterations; index++) {
    const output = run()
    sink += typeof output === 'string' ? output.length : output.children.length
  }
  return (performance.now() - start) / iterations
}
function median(values) {
  return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
}
const timings = []
function benchmark(name, mode, runs) {
  // Warm both JIT paths, then alternate which implementation runs first.
  for (const run of runs) sample(run, 1000)
  const iterations = Math.max(10, Math.min(100000, Math.ceil(25 / Math.max(sample(runs[0], 100), sample(runs[1], 100)))))
  const samples = [[], []]
  for (let round = 0; round < 9; round++) {
    for (const index of round % 2 ? [1, 0] : [0, 1]) samples[index].push(sample(runs[index], iterations))
  }
  const before = median(samples[0])
  const after = median(samples[1])
  const result = { fixture: name, mode, iterations, beforeMs: before, afterMs: after, ratio: after / before, samples }
  timings.push(result)
  console.log(`${name} ${mode}: ${before.toFixed(4)} -> ${after.toFixed(4)} ms (${result.ratio.toFixed(2)}x)`)
}

for (const { name, source } of process.argv.includes('--no-bench') ? [] : fixtures) {
  const modes = ['parse', 'renderAst', 'parseRender']
  if (name === 'ai-response.md') modes.push('streaming')
  for (const mode of modes) {
    const runs = apis.map(api => {
      const ast = api.parseMarkdown(source)
      const options = { extensions: [api.streamingMarkdownExtension()], headingIds: false, frontmatter: false }
      if (mode === 'parse') return () => api.parseMarkdown(source)
      if (mode === 'renderAst') return () => api.renderHtml(ast)
      if (mode === 'parseRender') return () => api.renderHtml(source)
      return () => {
        for (let end = 32; end < source.length; end += 32) sink += api.renderHtml(source.slice(0, end), options).length
        return api.renderHtml(source, options)
      }
    })
    benchmark(name, mode, runs)
  }
}

if (!process.argv.includes('--no-bench')) {
  for (const adapter of ['react', 'octane']) {
    const suffix = adapter === 'react' ? 'React' : 'Octane'
    const source = `import { Markdown, renderMarkdown${suffix} as render } from './src/${adapter}.ts'; export { render }; ` + (adapter === 'react'
      ? "import {createElement} from 'react'; import {renderToStaticMarkup} from 'react-dom/server'; export const ssr = input => renderToStaticMarkup(createElement(Markdown, {children: input}));"
      : "import {renderToStaticMarkup} from 'octane/server'; export const ssr = input => renderToStaticMarkup(Markdown, {children: input}).html;")
    const adapters = []
    for (const previous of [true, false]) {
      const code = await bundle(source, previous, ['react', 'react-dom/server', 'octane', 'octane/server'], 'cjs')
      const module = { exports: {} }
      new Function('require', 'module', 'exports', Buffer.from(code).toString())(require, module, module.exports)
      adapters.push(module.exports)
    }
    for (const { name, source } of fixtures.filter(fixture => /^(ai-response|small-doc|prose-heavy|tables-lists)\.md$/.test(fixture.name))) {
      benchmark(name, `${adapter}:nodes`, adapters.map((api, index) => {
        const ast = apis[index].parseMarkdown(source)
        return () => ({ children: api.render(ast) })
      }))
      benchmark(name, `${adapter}:ssr`, adapters.map(api => () => api.ssr(source)))
    }
  }
}
await mkdir('artifacts', { recursive: true })
const corpus = []
if (process.argv.includes('--corpus')) {
  for (const name of ['external-corpus', 'tanstack-corpus']) {
    const files = JSON.parse(await readFile(`artifacts/corpus/${name}.files.json`, 'utf8'))
    for (const profile of ['core', 'docs']) {
      const result = { name, profile, compared: 0, changed: 0, lostExact: [], gainedExact: [], newContentDifferences: [], changes: [] }
      const options = apis.map(api => ({ allowHtml: true, headingIds: false, extensions: profile === 'docs' ? api.docsMarkdownExtensions() : [] }))
      for (const file of files.filter(file => file.format === 'md' && !file.error)) {
        const path = resolve(name === 'external-corpus' ? '.corpus/external' : '..', file.repository, file.path)
        const source = await readFile(path, 'utf8')
        const outputs = apis.map((api, index) => api.renderHtml(source, options[index]))
        result.compared++
        if (outputs[0] === outputs[1]) continue
        result.changed++
        const reference = String(marked.parse(stripFrontmatter(source), { gfm: true }))
        const comparisons = outputs.map(output => compareRenderedHtml(output, reference))
        const id = `${file.repository}/${file.path}`
        if (comparisons[0] === 'exact' && comparisons[1] !== 'exact') result.lostExact.push(id)
        if (comparisons[0] !== 'exact' && comparisons[1] === 'exact') result.gainedExact.push(id)
        if (comparisons[0] !== 'content' && comparisons[1] === 'content') result.newContentDifferences.push(id)
        let offset = 0
        while (offset < Math.min(outputs[0].length, outputs[1].length) && outputs[0][offset] === outputs[1][offset]) offset++
        result.changes.push({ path: id, comparisons, before: outputs[0].slice(Math.max(0, offset - 80), offset + 200), after: outputs[1].slice(Math.max(0, offset - 80), offset + 200) })
      }
      corpus.push(result)
      console.log('Corpus:', { name, profile, compared: result.compared, changed: result.changed, lostExact: result.lostExact.length, gainedExact: result.gainedExact.length, newContentDifferences: result.newContentDifferences })
    }
  }
}
await writeFile(resolve('artifacts/audit-comparison.json'), JSON.stringify({ baseline, node: process.version, generatedAt: new Date().toISOString(), sizes, compatibility, timings, corpus, sink }, null, 2) + '\n')
assert.deepEqual(compatibility.lost, [], 'Previously passing CommonMark examples must not regress')
