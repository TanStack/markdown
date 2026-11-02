import { parseMarkdown } from '../src/parser.ts'
import { renderHtml } from '../src/html.ts'
import { streamingMarkdownExtension } from '../src/extensions/streaming.ts'
import { escapeHtml } from '../src/utils.ts'

function optionsFor(base, options) {
  return options === undefined ? base : { ...options, extensions: [...base.extensions, ...(options.extensions ?? [])] }
}

export function createBaselineRenderer() {
  const base = { extensions: [streamingMarkdownExtension()] }
  const counters = { fast: 0, full: 0 }
  return { counters, reset() {}, render(source, options) {
    counters.full++
    return renderHtml(source, optionsFor(base, options))
  } }
}

export function createOwnedAppendRenderer() {
  const base = { extensions: [streamingMarkdownExtension()] }
  const counters = { fast: 0, full: 0 }
  let state
  function full(source, options) {
    state = undefined
    counters.full++
    return renderHtml(source, optionsFor(base, options))
  }
  return { counters, reset() { state = undefined }, render(source, options) {
    if (options !== undefined || typeof source !== 'string') return full(source, options)
    const header = source.match(/^(`{3,}|~{3,})[^\n]*\n/)
    if (!header || source.includes('\r') || source.charCodeAt(0) === 0xFEFF) return full(source)
    const body = source.slice(header[0].length)
    if (/^ {0,3}[`~]/m.test(body)) return full(source)
    let prefix, suffix, escaped
    if (state && source.startsWith(state.source)) {
      prefix = state.prefix
      suffix = state.suffix
      escaped = [state.escaped, escapeHtml(source.slice(state.source.length))].join('')
    } else {
      const document = parseMarkdown(header[0], base)
      if (document.children.length !== 1 || document.children[0].type !== 'code') return full(source)
      const empty = renderHtml(document, base)
      const end = empty.indexOf('</code>')
      if (end === -1) return full(source)
      prefix = empty.slice(0, end)
      suffix = empty.slice(end)
      escaped = escapeHtml(body)
    }
    const output = [prefix, escaped, suffix].join('')
    state = { source, prefix, suffix, escaped }
    counters.fast++
    return output
  } }
}
