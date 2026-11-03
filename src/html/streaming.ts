import type { MarkdownExtension, MarkdownInput, RenderOptions } from '../types.js'

export interface StreamingHtmlRenderer {
  render(input: MarkdownInput, options?: RenderOptions): string
  /** Clear cached text while preserving mutable extension configuration. */
  reset(): void
}

import { parseMarkdown } from '../parser.js'
import { renderHtml } from '../html.js'
import { streamingMarkdownExtension } from '../extensions/streaming.js'
import { escapeHtml } from '../utils.js'

function optionsFor(base: { extensions: MarkdownExtension[] }, options?: RenderOptions): RenderOptions {
  return options === undefined ? base : { ...options, extensions: [...base.extensions, ...(options.extensions ?? [])] }
}

export function createStreamingHtmlRenderer(): StreamingHtmlRenderer {
  const base = { extensions: [streamingMarkdownExtension()] }
  let state: { source: string; html: string; suffix: string } | undefined
  let profileExposed = false
  function full(source: MarkdownInput, options?: RenderOptions): string {
    state = undefined
    return renderHtml(source, optionsFor(base, options))
  }
  function fenced(source: string): string {
    if (state && source.startsWith(state.source)) {
      const delta = source.slice(state.source.length)
      if (!delta) return state.html
      // Include the previous partial line when checking a chunk boundary.
      const tail = source.slice(state.source.lastIndexOf('\n') + 1)
      if (!delta.includes('\r') && !/^ {0,3}[`~]/m.test(tail)) {
        state.source = [state.source, delta].join('')
        state.html = [state.html.slice(0, -state.suffix.length), escapeHtml(delta), state.suffix].join('')
        return state.html
      }
    }
    const header = source.match(/^(?:[\s\S]*\n\n)?(?:`{3,}|~{3,})[^\n]*\n/)
    if (!header || source.includes('\r') || source.charCodeAt(0) === 0xFEFF) return full(source)
    const body = source.slice(header[0].length)
    if (/^ {0,3}[`~]/m.test(body) || !body) return full(source)
    const document = parseMarkdown(header[0], base)
    const last = document.children.at(-1)
    if (last?.type !== 'code' || last.value !== '') return full(source)
    const empty = renderHtml(document, base)
    const end = empty.lastIndexOf('</code>')
    if (end === -1) return full(source)
    const prefix = empty.slice(0, end)
    const suffix = empty.slice(end)
    const ownedSource = [header[0], body].join('')
    const output = [prefix, escapeHtml(body), suffix].join('')
    state = { source: ownedSource, html: output, suffix }
    return output
  }
  return { reset() { state = undefined }, render(source, options) {
    // Options hooks can retain and mutate the internal extension after this call.
    if (options !== undefined) profileExposed = true
    if (profileExposed || typeof source !== 'string') return full(source, options)
    if (!state && source[0] !== '`' && source[0] !== '~' && !source.includes('\n\n`') && !source.includes('\n\n~')) return full(source)
    return fenced(source)
  } }
}
