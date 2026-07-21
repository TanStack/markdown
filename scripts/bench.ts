// @ts-nocheck
import { performance } from 'node:perf_hooks'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as commonmark from 'commonmark'
import { parse as parseWasm, ready as wasmReady } from 'markdown-wasm'
import MarkdownIt from 'markdown-it'
import { marked } from 'marked'
import { micromark } from 'micromark'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { parseMarkdown, renderHtml } from '../src/index.js'

const root = process.cwd()
const fixtureDir = join(root, 'fixtures', 'benchmark')
const reportsDir = join(root, 'reports')

let sink = 0

interface BenchResult {
  group: string
  name: string
  fixture: string
  bytes: number
  iterations: number
  msPerOp: number
  outputBytes: number
  heapDeltaKb: number
}

async function main() {
  await mkdir(reportsDir, { recursive: true })
  await wasmReady

  const files = (await readdir(fixtureDir)).filter(file => file.endsWith('.md')).sort()
  const fixtures = await Promise.all(
    files.map(async file => ({
      name: file,
      source: await readFile(join(fixtureDir, file), 'utf8'),
    })),
  )

  const markdownIt = new MarkdownIt({ html: false, linkify: false, typographer: false })
  const commonmarkParser = new commonmark.Parser()
  const commonmarkRenderer = new commonmark.HtmlRenderer({ safe: true })
  const unifiedProcessor = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify)
  const astCache = new Map<string, ReturnType<typeof parseMarkdown>>()
  const astFor = (source: string) => {
    let document = astCache.get(source)
    if (!document) {
      document = parseMarkdown(source)
      astCache.set(source, document)
    }
    return document
  }

  const markdownRenderers = [
    {
      name: '@tanstack/markdown parse',
      run: (source: string) => parseMarkdown(source),
    },
    {
      name: '@tanstack/markdown render AST with external highlighter',
      run: (source: string) => renderHtml(astFor(source), { highlighter: externalHighlighter }),
    },
    {
      name: '@tanstack/markdown render AST',
      run: (source: string) => renderHtml(astFor(source)),
    },
    { name: '@tanstack/markdown parse+render with external highlighter', run: (source: string) => renderHtml(source, { highlighter: externalHighlighter }) },
    { name: '@tanstack/markdown parse+render', run: (source: string) => renderHtml(source) },
    { name: 'marked parse+render', run: (source: string) => marked.parse(source) },
    { name: 'markdown-it parse+render', run: (source: string) => markdownIt.render(source) },
    { name: 'micromark render', run: (source: string) => micromark(source) },
    {
      name: 'commonmark parse+render',
      run: (source: string) => commonmarkRenderer.render(commonmarkParser.parse(source)),
    },
    { name: 'markdown-wasm render', run: (source: string) => parseWasm(source) },
    { name: 'unified remark+rehype render', run: (source: string) => String(unifiedProcessor.processSync(source)) },
  ]

  const results: BenchResult[] = []

  for (const fixture of fixtures) {
    const iterations = markdownIterations(fixture.source.length)
    for (const renderer of markdownRenderers) {
      results.push(bench('markdown', renderer.name, fixture.name, fixture.source, iterations, renderer.run))
    }
  }

  await writeFile(join(reportsDir, 'benchmarks.json'), JSON.stringify({ generatedAt: new Date().toISOString(), sink, results }, null, 2))
  await writeFile(join(reportsDir, 'benchmarks.md'), renderMarkdownReport(results))
}

function bench(group: string, name: string, fixture: string, source: string, iterations: number, run: (source: string) => any): BenchResult {
  for (let index = 0; index < Math.min(20, iterations); index++) {
    const output = run(source)
    sink += String(output).length
  }

  const heapBefore = process.memoryUsage().heapUsed
  const start = performance.now()
  let output = ''

  for (let index = 0; index < iterations; index++) {
    output = String(run(source))
    sink += output.length
  }

  const total = performance.now() - start
  const heapAfter = process.memoryUsage().heapUsed

  return {
    group,
    name,
    fixture,
    bytes: Buffer.byteLength(source),
    iterations,
    msPerOp: total / iterations,
    outputBytes: Buffer.byteLength(output),
    heapDeltaKb: (heapAfter - heapBefore) / 1024,
  }
}

function markdownIterations(bytes: number): number {
  if (bytes < 1000) return 2000
  if (bytes < 2500) return 1000
  return 500
}

function renderMarkdownReport(results: BenchResult[]): string {
  const lines = [
    '# Benchmark Results',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Lower `ms/op` is better. Benchmarks run in Node with production package builds where available; heap delta is a coarse process-level signal, not an allocation profiler.',
    '',
  ]

  for (const group of ['markdown']) {
    lines.push(`## ${title(group)}`, '')
    lines.push('| Name | Fixture | Bytes | Iterations | ms/op | Output bytes | Heap delta KB |')
    lines.push('| :--- | :--- | ---: | ---: | ---: | ---: | ---: |')
    for (const result of results.filter(result => result.group === group)) {
      lines.push(
        `| ${result.name} | ${result.fixture} | ${result.bytes} | ${result.iterations} | ${result.msPerOp.toFixed(4)} | ${result.outputBytes} | ${result.heapDeltaKb.toFixed(1)} |`,
      )
    }
    lines.push('')
  }

  lines.push('## Averages', '')
  lines.push('| Group | Name | Mean ms/op |')
  lines.push('| :--- | :--- | ---: |')
  const grouped = new Map<string, BenchResult[]>()
  for (const result of results) {
    const key = `${result.group}::${result.name}`
    grouped.set(key, [...(grouped.get(key) ?? []), result])
  }
  for (const [key, items] of grouped) {
    const [group, name] = key.split('::')
    const mean = items.reduce((sum, item) => sum + item.msPerOp, 0) / items.length
    lines.push(`| ${group} | ${name} | ${mean.toFixed(4)} |`)
  }

  lines.push('')
  return lines.join('\n')
}

function title(value: string): string {
  return value.slice(0, 1).toUpperCase() + value.slice(1)
}

function externalHighlighter(code: string, lang = 'plaintext') {
  return code
    .split('\n')
    .map((line, index) => `<span class="external-line" data-lang="${lang}" data-line="${index + 1}">${escapeHtml(line)}</span>`)
    .join('\n')
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
