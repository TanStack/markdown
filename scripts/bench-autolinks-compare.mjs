import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build } from 'esbuild'

function output(api, fixture) {
  const options = { extensions: [api.autolinksExtension(), ...(fixture.stream ? [api.streamingMarkdownExtension()] : [])] }
  if (!fixture.stream) return api.renderHtml(fixture.source, options)
  const parts = []
  for (let length = 40; length < fixture.source.length + 40; length += 40) parts.push(api.renderHtml(fixture.source.slice(0, length), options))
  return parts.join('\0')
}

if (process.argv[2] === '--child') {
  const api = await import(pathToFileURL(process.argv[3]).href)
  const fixtures = JSON.parse(await readFile(process.argv[4], 'utf8'))
  let sink = 0
  const results = []
  for (const fixture of fixtures) {
    for (let index = 0; index < 1000; index++) sink += output(api, fixture).length
    const iterations = fixture.stream ? 150 : 1000
    const samples = []
    for (let round = 0; round < 3; round++) {
      const start = performance.now()
      for (let index = 0; index < iterations; index++) sink += output(api, fixture).length
      samples.push((performance.now() - start) / iterations)
    }
    results.push({ fixture: fixture.name, iterations, samples })
  }
  console.log(JSON.stringify({ results, sink, node: process.version }))
} else {
  const startedAt = new Date().toISOString()
  const root = fileURLToPath(new URL('..', import.meta.url))
  const directory = resolve(process.argv[2] || 'artifacts/autolink-comparison')
  const mode = process.argv[3] || 'calibrate'
  assert(['calibrate', 'compare'].includes(mode), 'Mode must be calibrate or compare')
  const baseline = process.argv[4] || '90796de9df55de2ffa2028aafa972dfac431b24f'
  const baselineCommit = execFileSync('git', ['rev-parse', '--verify', `${baseline}^{commit}`], { cwd: root, encoding: 'utf8' }).trim()
  const original = execFileSync('git', ['show', `${baselineCommit}:src/extensions/autolinks.ts`], { cwd: root, encoding: 'utf8' })
  const candidate = await readFile(resolve(root, 'src/extensions/autolinks.ts'), 'utf8')
  await mkdir(directory, { recursive: true })
  const sources = { original, control: original, candidate }
  const apis = {}
  const hashes = {}
  for (const [name, contents] of Object.entries(sources)) {
    const result = await build({
      stdin: { contents: "export {renderHtml} from './src/html.ts'; export {autolinksExtension} from './src/extensions/autolinks.ts'; export {streamingMarkdownExtension} from './src/extensions/streaming.ts'", resolveDir: root, loader: 'ts' },
      bundle: true, minify: true, write: false, format: 'esm', platform: 'browser', target: 'es2022',
      plugins: [{ name: 'frozen-extension', setup(builder) { builder.onLoad({ filter: /\/src\/extensions\/autolinks\.ts$/ }, () => ({ contents, loader: 'ts' })) } }],
    })
    const bytes = result.outputFiles[0].contents
    hashes[name] = { source: createHash('sha256').update(contents).digest('hex'), emitted: createHash('sha256').update(bytes).digest('hex') }
    const path = resolve(directory, `${name}.mjs`)
    await writeFile(path, bytes)
    apis[name] = await import(pathToFileURL(path).href)
  }
  assert.equal(hashes.original.emitted, hashes.control.emitted, 'Control must have identical emitted bytes')
  const response = await readFile(resolve(root, 'fixtures/benchmark/ai-response.md'), 'utf8')
  const fixtures = [
    { name: 'url-free', source: 'Ordinary prose with words, punctuation and heading-like text. '.repeat(80) },
    { name: 'urls', source: 'Read https://example.com/docs?q=one and http://example.org/a(b).\n\n'.repeat(60) },
    { name: 'bmp-boundaries', source: 'éhttps://example.com 1https://example.org _https://example.net 😀https://example.com\n\n'.repeat(40) },
    { name: 'malformed', source: 'https:// http://? <https://bad> [linked](https://example.com) `https://example.net`\n\n'.repeat(40) },
    { name: 'ai-response', source: response }, { name: 'ai-stream', source: response, stream: true },
  ]
  for (const fixture of fixtures) for (const api of Object.values(apis)) assert.equal(output(api, fixture), output(apis.original, fixture), `Equivalent completed work: ${fixture.name}`)
  const fixed = '𝒜https://example.com'
  assert.notEqual(output(apis.original, { source: fixed }), output(apis.candidate, { source: fixed }), 'Astral regression negative control')
  assert.equal(output(apis.candidate, { source: fixed }), apis.candidate.renderHtml(fixed), 'Astral boundary must render literally')
  assert.equal(apis.candidate.renderHtml('https://example.com', { extensions: [apis.candidate.autolinksExtension()], urlTransform: () => '' }), '<p>https://example.com</p>')
  const fixturePath = resolve(directory, 'fixtures.json')
  await writeFile(fixturePath, JSON.stringify(fixtures))
  const names = mode === 'calibrate' ? ['original', 'control'] : ['original', 'control', 'candidate']
  const rounds = []
  for (let round = 0; round < 5; round++) for (const variant of round % 2 ? [...names].reverse() : names) {
    const sample = JSON.parse(execFileSync(process.execPath, [fileURLToPath(import.meta.url), '--child', resolve(directory, `${variant}.mjs`), fixturePath], { encoding: 'utf8', timeout: 30000 }))
    rounds.push({ round, variant, ...sample })
    await writeFile(resolve(directory, 'partial.json'), JSON.stringify(rounds, null, 2))
  }
  const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
  const summary = fixtures.map(fixture => {
    const medianMs = Object.fromEntries(names.map(name => [name, median(rounds.filter(round => round.variant === name).flatMap(round => round.results.find(result => result.fixture === fixture.name).samples))]))
    return { fixture: fixture.name, medianMs, ratios: Object.fromEntries(names.map(name => [name, medianMs[name] / medianMs.original])) }
  })
  const receipt = { startedAt, endedAt: new Date().toISOString(), mode, baselineCommit, candidateCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), node: process.version, versions: process.versions, hashes, summary, rounds, limitations: 'Calibration is evidence, not automatic performance acceptance. Reject noisy identical controls before comparing candidate results. Correctness fixes deliberately differ and are excluded from timing fixtures. No allocation, retained-heap, peak-memory or browser-speed claim.' }
  await writeFile(resolve(directory, 'results.json'), JSON.stringify(receipt, null, 2))
  console.log(JSON.stringify(summary, null, 2))
}
