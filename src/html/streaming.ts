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
    const header = source.match(/^(`{3,}|~{3,})[^\n]*\n/)
    if (!header || source.includes('\r') || source.charCodeAt(0) === 0xFEFF) return full(source)
    const body = source.slice(header[0].length)
    if (/^ {0,3}[`~]/m.test(body)) return full(source)
    if (!body) return full(source)
    let ownedSource: string, output: string, suffix: string
    if (state && source.startsWith(state.source)) {
      const delta = source.slice(state.source.length)
      if (!delta) { return state.html }
      suffix = state.suffix
      ownedSource = [state.source, delta].join('')
      output = [state.html.slice(0, -suffix.length), escapeHtml(delta), suffix].join('')
    } else {
      const document = parseMarkdown(header[0], base)
      if (document.children.length !== 1 || document.children[0]?.type !== 'code') return full(source)
      const empty = renderHtml(document, base)
      const end = empty.indexOf('</code>')
      if (end === -1) return full(source)
      const prefix = empty.slice(0, end)
      suffix = empty.slice(end)
      ownedSource = [header[0], body].join('')
      output = [prefix, escapeHtml(body), suffix].join('')
    }
    state = { source: ownedSource, html: output, suffix }
    return output
  }
  return { reset() { state = undefined }, render(source, options) {
    // Options hooks can retain and mutate the internal extension after this call.
    if (options !== undefined) profileExposed = true
    if (profileExposed || typeof source !== 'string' || (source[0] !== '`' && source[0] !== '~')) return full(source, options)
    return fenced(source)
  } }
}
