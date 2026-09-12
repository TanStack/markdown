import { performance } from 'node:perf_hooks'
import { autolinksExtension } from '../src/extensions/autolinks.js'
import { renderHtml } from '../src/html.js'

const extensions = [autolinksExtension()]
const fixtures = [
  ['plain comment', 'Thanks for the thoughtful review. This paragraph reads clearly now.'],
  ['URL comment', 'See https://example.com/~alice~/notes and **https://example.com/docs**.'],
  ['punctuation', '(https://example.com/a_(b)). <https://example.com/path.>'],
  ...[1000, 2000, 4000].map(size => [`malformed ${size * 9} chars`, 'https://%'.repeat(size)]),
] as const
let sink = 0
const results = fixtures.map(([name, source]) => {
  const runs = [() => renderHtml(source!), () => renderHtml(source!, { extensions })]
  const iterations = Math.max(100, Math.floor(1_000_000 / source!.length))
  const sample = (run: () => string) => {
    const start = performance.now()
    for (let index = 0; index < iterations; index++) sink += run().length
    return (performance.now() - start) / iterations
  }
  runs.forEach(sample)
  const samples: number[][] = [[], []]
  for (let round = 0; round < 7; round++) {
    for (const index of round % 2 ? [1, 0] : [0, 1]) samples[index]!.push(sample(runs[index]!))
  }
  const medians = samples.map(values => [...values].sort((a, b) => a - b)[3]!)
  return { name, bytes: Buffer.byteLength(source!), iterations, coreMs: medians[0], autolinksMs: medians[1], samples }
})
console.log(JSON.stringify({ node: process.version, results, sink }, null, 2))
