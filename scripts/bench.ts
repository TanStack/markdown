// @ts-nocheck
import { performance } from 'node:perf_hooks'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cpus } from 'node:os'
import { createHighlighter } from '@tanstack/highlight/core'
import { plaintext } from '@tanstack/highlight/languages/plaintext'
import { ts } from '@tanstack/highlight/languages/ts'
import { createTanStackMarkdownHighlighter } from '@tanstack/highlight/markdown'
import * as commonmark from 'commonmark'
import { parse as parseWasm, ready as wasmReady } from 'markdown-wasm'
import MarkdownIt from 'markdown-it'
import { marked } from 'marked'
import { micromark } from 'micromark'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import { unified } from 'unified'
import { streamingMarkdownExtension } from '../src/extensions/streaming.js'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { benchStream, createAiResponseFixture, createFenceFixture } from './streaming-bench.js'

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

  const aiResponse = fixtures.find(fixture => fixture.name === 'ai-response.md')
  const streamingFixtures = [
    ...(aiResponse ? [createAiResponseFixture(aiResponse.source)] : []),
    ...[4, 16, 64].map(kib => createFenceFixture(kib)),
    createFenceFixture(64, '~~~'),
    createFenceFixture(64, '```', true),
  ]
  const streamingOptions = { extensions: [streamingMarkdownExtension()], frontmatter: false, headingIds: false }
  const highlighter = createTanStackMarkdownHighlighter(createHighlighter({ languages: [plaintext, ts] }))
  const highlightedOptions = { ...streamingOptions, highlighter }
  const streamingRenderers = [
    { name: '@tanstack/markdown streaming parse', run: (source: string) => parseMarkdown(source, streamingOptions) },
    { name: '@tanstack/markdown streaming profile', run: (source: string) => renderHtml(source, streamingOptions) },
    { name: '@tanstack/markdown streaming with @tanstack/highlight', run: (source: string) => renderHtml(source, highlightedOptions) },
    { name: 'marked progressive parse+render', run: (source: string) => String(marked.parse(source)) },
  ]
  for (const fixture of streamingFixtures) {
    const iterations = fixture.source.length < 1000 ? 250 : fixture.source.length <= 4096 ? 20 : fixture.source.length <= 16384 ? 10 : 5
    for (const renderer of streamingRenderers) {
      console.log(`Streaming: ${fixture.name}, ${renderer.name} (${iterations} replays)`)
      const result = benchStream(renderer.name, fixture, iterations, renderer.run)
      sink += result.checksum
      results.push(result)
    }
  }

  const environment = { node: process.version, platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model }
  await writeFile(join(reportsDir, 'benchmarks.json'), JSON.stringify({ generatedAt: new Date().toISOString(), environment, sink, results }, null, 2))
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
    `Environment: Node ${process.version}, ${process.platform} ${process.arch}, ${cpus()[0]?.model ?? 'unknown CPU'}.`,
    '',
    'Lower `ms/op` is better. Benchmarks run in Node with production dependency builds where available and local Markdown source; heap delta is a coarse process-level signal, not an allocation profiler. Streaming rows replay the complete response in 32-character chunks, so one operation is one progressive response. Every prefix is parsed from scratch. Replay time includes slicing, timing, and collecting samples; per-update latency times only the parser or renderer call. Browser layout, framework updates, and network delays are excluded.',
    '',
  ]

  for (const group of ['markdown', 'streaming']) {
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

  lines.push('For persistent React and incremental DOM comparisons against streaming-focused libraries, see the [browser streaming report](./streaming-browser.md).', '')
  lines.push('## Streaming update latency', '')
  lines.push('All timings below are milliseconds, pooled across measured replays after two full warmup replays. Percentiles use nearest rank. Each update contributes its output to a checksum. Parse-only rows use the same streaming options as rendering rows and report zero HTML output bytes.', '')
  lines.push('Generated fixtures contain a growing TypeScript fence with an unfinished final line. Backtick fences cover 4, 16, and 64 KiB; a 64 KiB tilde fence checks the other delimiter. The closing case appends a closing fence and trailing prose to the same 64 KiB body. Open-fence membership uses known fixture offsets, independently of the parser. The late-open sample covers prefixes in the last 10% of the source up to the closing fence, or EOF when it never closes.', '')
  lines.push('The streaming highlighter is the installed @tanstack/highlight TypeScript tokenizer and HTML adapter, initialized before timing and called on every code block on every update. The non-streaming external-highlighter rows above use a line-wrapping stub. Parse-only and plain-render rows help compare parsing cost with rendering; these are separate runs, not an instrumented phase breakdown.', '')
  lines.push('| Name | Fixture | Updates/replay | Open updates/replay | Update p50 | Update p95 | Open p50 | Open p95 | Open max | Late open p95 | Final p50 |', '| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |')
  const ms = (value: number | undefined) => value === undefined ? 'n/a' : value.toFixed(4)
  for (const result of results.filter(result => result.group === 'streaming')) {
    const { latency } = result
    lines.push(`| ${result.name} | ${result.fixture} | ${result.updatesPerReplay} | ${result.openFenceUpdatesPerReplay} | ${ms(latency.all?.p50Ms)} | ${ms(latency.all?.p95Ms)} | ${ms(latency.openFence?.p50Ms)} | ${ms(latency.openFence?.p95Ms)} | ${ms(latency.openFence?.maxMs)} | ${ms(latency.lastTenPercentOpenFence?.p95Ms)} | ${ms(latency.finalUpdate?.p50Ms)} |`)
  }
  lines.push('')

  lines.push('## Averages', '')
  lines.push('| Group | Name | Mean ms/op |')
  lines.push('| :--- | :--- | ---: |')
  const grouped = new Map<string, BenchResult[]>()
  for (const result of results) {
    if (result.group === 'streaming') continue
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
