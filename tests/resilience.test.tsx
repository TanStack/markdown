import { performance } from 'node:perf_hooks'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderToStaticMarkup as renderOctaneToStaticMarkup } from 'octane/server'
import { describe, expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

describe('parser resilience', () => {
  it.each([
    ['unmatched brackets', '['.repeat(32_000)],
    ['unmatched backticks', '`'.repeat(32_000)],
    ['unmatched emphasis', '*a'.repeat(16_000)],
  ])('keeps %s bounded', (_, source) => {
    const start = performance.now()
    parseMarkdown(source)
    expect(performance.now() - start).toBeLessThan(500)
  })

  it('caps pathological inline nesting without throwing', () => {
    const source = `${'*'.repeat(4_000)}content${'*'.repeat(4_000)}`
    expect(() => renderHtml(source)).not.toThrow()
  })

  it.each([
    ['blockquotes', '> '.repeat(10_000) + 'content'],
    ['lists', Array.from({ length: 512 }, (_, depth) => `${'  '.repeat(depth)}- item`).join('\n')],
  ])('keeps deeply nested %s bounded', (_, source) => {
    const start = performance.now()
    expect(() => parseMarkdown(source)).not.toThrow()
    expect(performance.now() - start).toBeLessThan(500)
  })

  it('is deterministic and renderer-equivalent across a fixed malformed-input corpus', () => {
    const random = seededRandom(0x5eed)
    const alphabet = 'abc XYZ012[]()_*~`<>!#|\\\n:-.'

    for (let example = 0; example < 300; example++) {
      const length = 16 + Math.floor(random() * 240)
      let source = ''
      for (let index = 0; index < length; index++) source += alphabet[Math.floor(random() * alphabet.length)]

      const first = renderHtml(source)
      const second = renderHtml(source)
      const react = renderToStaticMarkup(<Markdown>{source}</Markdown>)
      const octane = renderOctaneToStaticMarkup(OctaneMarkdown, { children: source }).html
      expect(second).toBe(first)
      expect(normalizeStaticMarkup(react)).toBe(normalizeStaticMarkup(first))
      expect(normalizeStaticMarkup(octane)).toBe(normalizeStaticMarkup(first))
    }
  })
})

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 0x1_0000_0000
  }
}
