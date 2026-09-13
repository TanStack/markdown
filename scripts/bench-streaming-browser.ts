import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { cpus } from 'node:os'
import { build } from 'esbuild'
import { chromium } from 'playwright'
import { createFenceFixture, summarizeLatency } from './streaming-bench.js'
import type { RendererName, runBrowserCase } from './streaming-browser.js'

const smoke = process.argv.includes('--smoke')
const rendererFilter = process.argv.find(arg => arg.startsWith('--renderer='))?.slice(11)
const fixtureFilter = process.argv.find(arg => arg.startsWith('--fixture='))?.slice(10)
const filtered = rendererFilter !== undefined || fixtureFilter !== undefined
const iterations = smoke ? 1 : 5
const names: RendererName[] = ['TanStack Markdown React', 'Streamdown React', 'streaming-markdown DOM']
const fixtures = [
  ...[4, 16, 64].map(kib => createFenceFixture(kib)),
  createFenceFixture(64, '~~~'),
  createFenceFixture(64, '```', true),
]
const openFence = createFenceFixture(16)
const prose = Array.from({ length: 160 }, (_, index) =>
  `## Finding ${index}\n\nThe completed response includes **important details** and [a reference](https://example.com/${index}).\n\n`,
).join('').slice(0, 16 * 1024) + '\n\n'
fixtures.push({
  ...openFence,
  name: 'settled-prose-16kib-then-open-fence-16kib',
  source: prose + openFence.source,
  fenceOpenAt: prose.length + openFence.fenceOpenAt!,
})

const bundle = await build({
  entryPoints: ['scripts/streaming-browser.tsx'], bundle: true, write: false,
  minify: true, platform: 'browser', format: 'iife', target: 'es2022', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
})
const html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;font:16px/1.5 sans-serif}#output{width:800px}pre{white-space:pre;font:14px/1.5 monospace}</style><div id="output"></div><script src="/bench.js"></script>'
const server = createServer((request, response) => {
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  response.setHeader('Content-Type', request.url === '/bench.js' ? 'text/javascript' : 'text/html')
  response.end(request.url === '/bench.js' ? bundle.outputFiles[0]!.contents : html)
})
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('Missing benchmark server address')

let browser
try {
  browser = await chromium.launch({ headless: true, ...(process.env.BENCH_BROWSER_CHANNEL ? { channel: process.env.BENCH_BROWSER_CHANNEL } : {}) })
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 1 })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${address.port}`)
  const environment = {
    node: process.version, browser: browser.version(), platform: process.platform, arch: process.arch, cpu: cpus()[0]?.model,
    isolated: await page.evaluate(() => crossOriginIsolated),
    dependencies: Object.fromEntries(await Promise.all(['react', 'react-dom', 'streamdown', 'streaming-markdown'].map(async name =>
      [name, JSON.parse(await readFile(`node_modules/${name}/package.json`, 'utf8')).version],
    ))),
  }
  const results = []
  const selectedFixtures = fixtures.filter(fixture => !fixtureFilter || fixture.name.includes(fixtureFilter))
  const selectedNames = names.filter(name => !rendererFilter || name.includes(rendererFilter))
  if (!selectedFixtures.length || !selectedNames.length) throw new Error('No benchmark cases match the filters')
  for (const fixture of smoke ? selectedFixtures.slice(0, 1) : selectedFixtures) {
    for (const name of selectedNames) {
      console.log(`Browser streaming: ${fixture.name}, ${name}`)
      const raw = await page.evaluate(({ name, fixture, iterations }) => window.runStreamingCase(name, fixture, iterations), { name, fixture, iterations }) as ReturnType<typeof runBrowserCase>
      if (errors.length) throw new Error(errors.join('\n'))
      const samples = raw.measured?.samples ?? []
      const open = samples.filter(sample => sample.openFence)
      const late = open.filter(sample => sample.end >= (fixture.fenceClosedAt ?? fixture.source.length) * 0.9)
      const summary = (subset: typeof samples) => ({
        update: summarizeLatency(subset.map(sample => sample.updateMs)),
        updateAndLayout: summarizeLatency(subset.map(sample => sample.updateAndLayoutMs)),
      })
      const result = {
        name, fixture: fixture.name, bytes: Buffer.byteLength(fixture.source), chunkSize: 32, iterations, warmupReplays: 2,
        validation: raw.validation,
        replay: summarizeLatency(raw.measured?.replayMs ?? []),
        finish: summarizeLatency(raw.measured?.finishMs ?? []),
        updates: summary(samples), openFence: summary(open), lateOpenFence: summary(late), checksum: raw.measured?.checksum ?? 0,
      }
      results.push(result)
      console.log(JSON.stringify({ valid: result.validation.passed, replayMs: result.replay?.meanMs, openUpdateP95: result.openFence.update?.p95Ms, openLayoutP95: result.openFence.updateAndLayout?.p95Ms, ...(!result.validation.passed ? { validation: result.validation } : {}) }))
    }
  }
  if (smoke || filtered) {
    if (results.some(result => !result.validation.passed)) throw new Error('Browser smoke validation failed')
  } else {
    const generatedAt = new Date().toISOString()
    await writeFile('reports/streaming-browser.json', JSON.stringify({ generatedAt, environment, results }, null, 2) + '\n')
    const ms = (value: number | undefined) => value === undefined ? 'n/a' : value.toFixed(3)
    const report = [
      '# Streaming library comparison', '',
      `Generated: ${generatedAt}`, '',
      `Chrome ${environment.browser}, ${environment.cpu}, ${environment.platform} ${environment.arch}. Production React ${environment.dependencies.react}, Streamdown ${environment.dependencies.streamdown}, streaming-markdown ${environment.dependencies['streaming-markdown']}. Cross-origin isolation: ${environment.isolated}.`, '',
      'Each response arrives in 32-character chunks. TanStack Markdown and Streamdown keep a React root mounted across updates and commit each update with flushSync. Streamdown uses streaming mode with incomplete-Markdown repair and block memoization enabled. streaming-markdown keeps one incremental parser and receives only new chunks through its default DOM renderer. Each replay starts with a fresh root or parser.', '',
      'Code is plain text for every library. Streamdown uses custom pre/code components, with animations, controls, and line numbers disabled. Its default parsing, GFM, and sanitization remain enabled. No syntax highlighter is installed in this browser harness. This isolates streaming rendering from highlighter choices and is not a comparison of default product interfaces or syntax coverage.', '',
      'Update latency includes parsing, rendering, and synchronous DOM commit. Update + layout also forces style and layout with offsetHeight after every chunk. Paint, network delays, animation frames, and bundle loading are excluded. All libraries use the same 800px-wide container and basic typography. Browser timer resolution limits very small measurements.', '',
      'Five measured replays follow two full warmups. Percentiles use nearest rank over pooled updates. Late-open samples cover the last 10% of source before the closing fence or EOF. Replay totals include update sampling, forced layout, and stream finalization, but exclude root/parser creation, cleanup, precomputed prefix/chunk slicing, and validation. End-of-stream finalization is also recorded separately in JSON.', '',
      'Before timing, a separate replay checks the code block at every open-fence update, ignoring serializer-added trailing newlines. Up to three trailing characters may be buffered for delimiter recognition, and the observed maximum is reported. Final code must match after trimming trailing whitespace; exact-text differences are recorded separately in JSON. Cases that fail this content check receive no timing. This validates the code-fence workload, not full Markdown conformance.', '',
      '| Renderer | Fixture | Replay mean ms | Open update p95 ms | Open update + layout p95 ms | Late open update + layout p95 ms | Max update + layout ms | Buffered chars |',
      '| :--- | :--- | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...results.map(result => `| ${result.name} | ${result.fixture} | ${ms(result.replay?.meanMs)} | ${ms(result.openFence.update?.p95Ms)} | ${ms(result.openFence.updateAndLayout?.p95Ms)} | ${ms(result.lateOpenFence.updateAndLayout?.p95Ms)} | ${ms(result.updates.updateAndLayout?.maxMs)} | ${result.validation.passed ? result.validation.maxBufferedCharacters : 'failed content check'} |`), '',
      ...results.filter(result => !result.validation.passed).map(result => `${result.name}, ${result.fixture}: ${result.validation.missingFenceUpdates} open updates missing a code fence; ${result.validation.mismatchedCodeUpdates} updates with incorrect or buffered code beyond the allowed three characters; final code match: ${result.validation.finalCodeMatches}.`), '',
      'The settled-prose case adds 16 KiB of completed prose before a growing 16 KiB fence, so retained blocks can benefit from memoization. The other cases contain one heading and one growing fence. Results apply to these fixtures and configurations.', '',
      'Reproduce with `pnpm exec playwright install chromium` followed by `pnpm run bench:streaming`. To use an installed Chrome instead, run `BENCH_BROWSER_CHANNEL=chrome pnpm run bench:streaming`. `--smoke` runs the smallest case and validates the harness without replacing reports.', '',
      'Library APIs: [Streamdown](https://streamdown.ai/docs/components), [streaming-markdown](https://github.com/thetarnav/streaming-markdown).', '',
    ].join('\n')
    await writeFile('reports/streaming-browser.md', report)
  }
} finally {
  await browser?.close()
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
}
