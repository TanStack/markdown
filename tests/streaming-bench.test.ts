import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { benchStream, createAiResponseFixture, createFenceFixture, streamUpdates, summarizeLatency } from '../scripts/streaming-bench.js'
import { parseMarkdown } from '../src/index.js'

describe('streaming benchmark coverage', () => {
  it('samples the open fence in the original AI response fixture', () => {
    const source = readFileSync(new URL('../fixtures/benchmark/ai-response.md', import.meta.url), 'utf8')
    const fixture = createAiResponseFixture(source)
    const updates = [...streamUpdates(fixture)]
    const open = updates.filter(update => update.openFence)
    expect(open.length).toBeGreaterThan(0)
    expect(updates.at(-1)?.openFence).toBe(false)
    for (const update of open) {
      const code = parseMarkdown(update.prefix).children.at(-1)
      expect(code?.type).toBe('code')
      if (code?.type !== 'code') throw new Error('Expected a code block')
      expect(code.value).toBe(update.prefix.slice(fixture.fenceOpenAt))
    }
    expect(() => createAiResponseFixture('No fence')).toThrow('Expected a completed TypeScript fence')
  })

  it.each([31, 32, 33, 64])('renders the final prefix exactly once for %i characters', length => {
    const updates = [...streamUpdates({ name: 'boundary', source: 'x'.repeat(length) })]
    expect(updates.map(update => update.end)).toEqual(
      Array.from({ length: Math.ceil(length / 32) }, (_, index) => Math.min((index + 1) * 32, length)),
    )
    expect(updates.filter(update => update.final)).toHaveLength(1)
    expect(updates.at(-1)?.prefix).toHaveLength(length)
  })

  it.each(['```', '~~~'])('keeps generated %s fences open through the last update', fence => {
    for (const kib of [4, 16, 64]) {
      const fixture = createFenceFixture(kib, fence)
      expect(Buffer.byteLength(fixture.source)).toBe(kib * 1024)
      const updates = [...streamUpdates(fixture)]
      expect(updates.at(-1)?.openFence).toBe(true)
      // Check actual AST contents at early, middle, and final prefixes.
      const open = updates.filter(update => update.openFence)
      for (const update of [open[0]!, open[Math.floor(open.length / 2)]!, open.at(-1)!]) {
        const code = parseMarkdown(update.prefix).children.at(-1)
        expect(code?.type).toBe('code')
        if (code?.type !== 'code') throw new Error('Expected a code block')
        expect(code.lang).toBe('ts')
        expect(code.value).toBe(update.prefix.slice(fixture.fenceOpenAt))
      }
    }
  })

  it('marks a split closing delimiter open until it is complete', () => {
    const fixture = createFenceFixture(4, '```', true)
    const updates = [...streamUpdates(fixture, 1)]
    expect(updates.find(update => update.end === fixture.fenceClosedAt! - 1)?.openFence).toBe(true)
    expect(updates.find(update => update.end === fixture.fenceClosedAt)?.openFence).toBe(false)
    expect(updates.at(-1)?.openFence).toBe(false)
    const document = parseMarkdown(fixture.source)
    expect(document.children.map(node => node.type)).toEqual(['heading', 'code', 'paragraph'])
  })

  it('excludes warmups from samples and consumes every update output', () => {
    const fixture = createFenceFixture(4, '```', true)
    const updates = [...streamUpdates(fixture)]
    let calls = 0
    const result = benchStream('test', fixture, 3, source => {
      calls++
      return source
    })
    expect(calls).toBe(updates.length * 5)
    expect(result.checksum).toBe(updates.reduce((sum, update) => sum + update.prefix.length, 0) * 5)
    expect(result.latency.all?.samples).toBe(updates.length * 3)
    expect(result.latency.openFence?.samples).toBe(updates.filter(update => update.openFence).length * 3)
    expect(result.latency.finalUpdate?.samples).toBe(3)
    expect(result.outputBytes).toBe(Buffer.byteLength(fixture.source))
  })

  it('calculates nearest-rank percentiles and distinguishes absent samples', () => {
    expect(summarizeLatency([])).toBeNull()
    expect(summarizeLatency([5, 1, 4, 2, 3])).toEqual({ samples: 5, meanMs: 3, p50Ms: 3, p95Ms: 5, maxMs: 5 })
    expect(summarizeLatency(Array.from({ length: 100 }, (_, index) => index + 1))?.p95Ms).toBe(95)
  })
})
