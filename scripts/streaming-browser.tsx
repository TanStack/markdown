import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import type { ReactNode } from 'react'
import { Streamdown } from 'streamdown'
import * as smd from 'streaming-markdown'
import { Markdown } from '../src/react.js'
import { streamingMarkdownExtension } from '../src/extensions/streaming.js'
import type { StreamingFixture } from './streaming-bench.js'

export const rendererNames = ['TanStack Markdown React', 'Streamdown React', 'streaming-markdown DOM'] as const
export type RendererName = typeof rendererNames[number]

const extensions = [streamingMarkdownExtension()]
const plainCodeComponents = {
  pre: ({ children }: { children?: ReactNode }) => <pre>{children}</pre>,
  code: ({ children, className }: { children?: ReactNode; className?: string | undefined }) => <code className={className}>{children}</code>,
}

function mount(name: RendererName, container: HTMLElement) {
  if (name === 'streaming-markdown DOM') {
    const parser = smd.parser(smd.default_renderer(container))
    return {
      update: (_prefix: string, chunk: string) => smd.parser_write(parser, chunk),
      finish: () => smd.parser_end(parser),
      dispose: () => container.replaceChildren(),
    }
  }
  const root = createRoot(container)
  let lastPrefix = ''
  const render = (prefix: string, streaming: boolean) => flushSync(() => root.render(
    name === 'TanStack Markdown React'
      ? <Markdown extensions={extensions} frontmatter={false} headingIds={false}>{prefix}</Markdown>
      : <Streamdown mode="streaming" isAnimating={streaming} animated={false} controls={false} lineNumbers={false} components={plainCodeComponents}>{prefix}</Streamdown>,
  ))
  return {
    update: (prefix: string, _chunk: string) => { lastPrefix = prefix; render(prefix, true) },
    finish: () => { if (name === 'Streamdown React') render(lastPrefix, false) },
    dispose: () => flushSync(() => root.unmount()),
  }
}

function updates(fixture: StreamingFixture) {
  return Array.from({ length: Math.ceil(fixture.source.length / 32) }, (_, index) => {
    const end = Math.min((index + 1) * 32, fixture.source.length)
    return {
      end, prefix: fixture.source.slice(0, end), chunk: fixture.source.slice(index * 32, end),
      openFence: end >= fixture.fenceOpenAt! && (fixture.fenceClosedAt === undefined || end < fixture.fenceClosedAt),
    }
  })
}

export interface Validation {
  passed: boolean
  openUpdates: number
  missingFenceUpdates: number
  mismatchedCodeUpdates: number
  maxBufferedCharacters: number
  finalCodeMatches: boolean
  finalTextDiffers?: boolean
  firstMismatch?: { end: number; expectedTail: string; actualTail: string }
  finalMismatch?: { expectedTail: string; actualTail: string }
}

// Validate separately so DOM reads and string comparisons do not enter measured update times.
function validate(name: RendererName, fixture: StreamingFixture): Validation {
  const container = document.getElementById('output')!
  const renderer = mount(name, container)
  const result: Validation = { passed: true, openUpdates: 0, missingFenceUpdates: 0, mismatchedCodeUpdates: 0, maxBufferedCharacters: 0, finalCodeMatches: false }
  let expectedFinalCode = ''
  for (const update of updates(fixture)) {
    renderer.update(update.prefix, update.chunk)
    if (!update.openFence) continue
    result.openUpdates++
    const code = container.querySelector('pre code')
    expectedFinalCode = update.prefix.slice(fixture.fenceOpenAt)
    // remark-rehype appends a terminal newline to code; ignore that serializer difference.
    const expected = expectedFinalCode.replace(/\n+$/, '')
    const actual = (code?.textContent ?? '').replace(/\n+$/, '')
    // Incremental parsers may hold the last delimiter or newline. Count that lag explicitly.
    const buffered = expected.startsWith(actual) ? expected.length - actual.length : Infinity
    if (!code) result.missingFenceUpdates++
    if (buffered > 3) result.mismatchedCodeUpdates++
    result.maxBufferedCharacters = Math.max(result.maxBufferedCharacters, Number.isFinite(buffered) ? buffered : expected.length)
    if ((!code || buffered > 3) && !result.firstMismatch) {
      result.firstMismatch = { end: update.end, expectedTail: expected.slice(-80), actualTail: actual.slice(-80) }
    }
  }
  renderer.finish()
  // Our generated closing cases end the same code body as the unfinished case.
  const actualFinalCode = container.querySelector('pre code')?.textContent ?? ''
  result.finalTextDiffers = actualFinalCode !== expectedFinalCode
  result.finalCodeMatches = actualFinalCode.trimEnd() === expectedFinalCode.trimEnd()
  if (!result.finalCodeMatches) result.finalMismatch = { expectedTail: expectedFinalCode.slice(-80), actualTail: actualFinalCode.slice(-80) }
  result.passed = result.missingFenceUpdates === 0 && result.mismatchedCodeUpdates === 0 && result.finalCodeMatches
  renderer.dispose()
  return result
}

export function runBrowserCase(name: RendererName, fixture: StreamingFixture, iterations: number) {
  const validation = validate(name, fixture)
  if (!validation.passed) return { name, fixture: fixture.name, validation, measured: null }
  const container = document.getElementById('output')!
  const prefixes = updates(fixture)
  const samples: { end: number; openFence: boolean; updateMs: number; updateAndLayoutMs: number }[] = []
  const replayMs: number[] = []
  const finishMs: number[] = []
  let checksum = 0
  for (let iteration = -2; iteration < iterations; iteration++) {
    const renderer = mount(name, container)
    const replayStart = performance.now()
    for (const update of prefixes) {
      const start = performance.now()
      renderer.update(update.prefix, update.chunk)
      const committed = performance.now()
      // Force style and layout after every update, without claiming to measure paint.
      checksum += container.offsetHeight
      const laidOut = performance.now()
      if (iteration >= 0) samples.push({ end: update.end, openFence: update.openFence, updateMs: committed - start, updateAndLayoutMs: laidOut - start })
    }
    const finishStart = performance.now()
    renderer.finish()
    checksum += container.offsetHeight
    const end = performance.now()
    if (iteration >= 0) {
      finishMs.push(end - finishStart)
      replayMs.push(end - replayStart)
    }
    checksum += container.textContent?.length ?? 0
    renderer.dispose()
  }
  return { name, fixture: fixture.name, validation, measured: { samples, replayMs, finishMs, checksum } }
}

declare global {
  interface Window {
    runStreamingCase: typeof runBrowserCase
  }
}
window.runStreamingCase = runBrowserCase
