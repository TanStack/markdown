import { performance } from 'node:perf_hooks'

export interface StreamingFixture {
  name: string
  source: string
  // Offsets are known from fixture construction, not inferred by the parser under test.
  fenceOpenAt?: number
  fenceClosedAt?: number
}

export interface LatencySummary {
  samples: number
  meanMs: number
  p50Ms: number
  p95Ms: number
  maxMs: number
}

export function createAiResponseFixture(source: string): StreamingFixture {
  const opening = source.indexOf('```ts\n')
  const fenceOpenAt = opening + 6
  const closing = source.indexOf('\n```', fenceOpenAt)
  if (opening < 0 || closing < 0) throw new Error('Expected a completed TypeScript fence in ai-response.md')
  return { name: 'ai-response.md', source, fenceOpenAt, fenceClosedAt: closing + 4 }
}

export function createFenceFixture(kib: number, fence = '```', closed = false): StreamingFixture {
  const opening = `# Generated configuration\n\n${fence}ts\n`
  const lines: string[] = []
  let length = opening.length
  for (let index = 0; length < kib * 1024; index++) {
    const line = `const route${index}: Route = { path: '/api/${index}', enabled: true }\n`
    lines.push(line)
    length += line.length
  }
  // ASCII makes the requested character and byte lengths identical. The last line is unfinished.
  const source = (opening + lines.join('')).slice(0, kib * 1024)
  return {
    name: `${closed ? 'closing' : 'unfinished'}-${fence === '```' ? 'backtick' : 'tilde'}-${kib}kib`,
    source: closed ? `${source}\n${fence}\n\nConfiguration complete.\n` : source,
    fenceOpenAt: opening.length,
    ...(closed ? { fenceClosedAt: source.length + 1 + fence.length } : {}),
  }
}

export function* streamUpdates(fixture: StreamingFixture, chunkSize = 32) {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) throw new Error('chunkSize must be a positive integer')
  for (let start = 0; start < fixture.source.length; start += chunkSize) {
    const end = Math.min(start + chunkSize, fixture.source.length)
    yield {
      prefix: fixture.source.slice(0, end),
      end,
      openFence: fixture.fenceOpenAt !== undefined && end >= fixture.fenceOpenAt
        && (fixture.fenceClosedAt === undefined || end < fixture.fenceClosedAt),
      final: end === fixture.source.length,
    }
  }
}

export function summarizeLatency(samples: number[]): LatencySummary | null {
  if (!samples.length) return null
  const sorted = [...samples].sort((a, b) => a - b)
  return {
    samples: sorted.length,
    meanMs: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    p50Ms: sorted[Math.ceil(sorted.length * 0.5) - 1]!,
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1]!,
    maxMs: sorted[sorted.length - 1]!,
  }
}

export function benchStream(name: string, fixture: StreamingFixture, iterations: number, run: (source: string) => string | { children: unknown[] }) {
  const chunkSize = 32
  const warmupReplays = 2
  let checksum = 0
  let outputBytes = 0
  const consume = (output: ReturnType<typeof run>) => {
    checksum += typeof output === 'string' ? output.length : output.children.length
  }
  for (let index = 0; index < warmupReplays; index++) {
    for (const update of streamUpdates(fixture, chunkSize)) consume(run(update.prefix))
  }

  const all: number[] = []
  const open: number[] = []
  const lateOpen: number[] = []
  const final: number[] = []
  const replays: number[] = []
  const heapBefore = process.memoryUsage().heapUsed
  for (let index = 0; index < iterations; index++) {
    const replayStart = performance.now()
    for (const update of streamUpdates(fixture, chunkSize)) {
      const start = performance.now()
      const output = run(update.prefix)
      const elapsed = performance.now() - start
      consume(output)
      all.push(elapsed)
      if (update.openFence) {
        open.push(elapsed)
        if (update.end >= (fixture.fenceClosedAt ?? fixture.source.length) * 0.9) lateOpen.push(elapsed)
      }
      if (update.final) {
        final.push(elapsed)
        outputBytes = typeof output === 'string' ? Buffer.byteLength(output) : 0
      }
    }
    replays.push(performance.now() - replayStart)
  }

  return {
    group: 'streaming', name, fixture: fixture.name,
    bytes: Buffer.byteLength(fixture.source), iterations,
    msPerOp: replays.reduce((sum, value) => sum + value, 0) / iterations,
    outputBytes, heapDeltaKb: (process.memoryUsage().heapUsed - heapBefore) / 1024,
    chunkSize, warmupReplays, updatesPerReplay: Math.ceil(fixture.source.length / chunkSize),
    openFenceUpdatesPerReplay: open.length / iterations,
    checksum,
    latency: {
      all: summarizeLatency(all), openFence: summarizeLatency(open),
      lastTenPercentOpenFence: summarizeLatency(lateOpen), finalUpdate: summarizeLatency(final),
    },
  }
}
