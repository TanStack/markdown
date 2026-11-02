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
  let profileExposed = false
  function full(source, options) {
    state = undefined
    counters.full++
    return renderHtml(source, optionsFor(base, options))
  }
  function fenced(source) {
    const header = source.match(/^(`{3,}|~{3,})[^\n]*\n/)
    if (!header || source.includes('\r') || source.charCodeAt(0) === 0xFEFF) return full(source)
    const body = source.slice(header[0].length)
    if (/^ {0,3}[`~]/m.test(body)) return full(source)
    if (!body) return full(source)
    let ownedSource, output, suffix
    if (state && source.startsWith(state.source)) {
      const delta = source.slice(state.source.length)
      if (!delta) { counters.fast++; return state.html }
      suffix = state.suffix
      ownedSource = [state.source, delta].join('')
      output = [state.html.slice(0, -suffix.length), escapeHtml(delta), suffix].join('')
    } else {
      const document = parseMarkdown(header[0], base)
      if (document.children.length !== 1 || document.children[0].type !== 'code') return full(source)
      const empty = renderHtml(document, base)
      const end = empty.indexOf('</code>')
      if (end === -1) return full(source)
      const prefix = empty.slice(0, end)
      suffix = empty.slice(end)
      ownedSource = [header[0], body].join('')
      output = [prefix, escapeHtml(body), suffix].join('')
    }
    state = { source: ownedSource, html: output, suffix }
    counters.fast++
    return output
  }
  return { counters, reset() { state = undefined }, render(source, options) {
    // Options hooks can retain and mutate the internal extension after this call.
    if (options !== undefined) profileExposed = true
    if (profileExposed || typeof source !== 'string' || (source[0] !== '`' && source[0] !== '~')) return full(source, options)
    return fenced(source)
  } }
}
