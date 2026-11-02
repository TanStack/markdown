import { parseMarkdown } from '../src/parser.ts'
import { renderHtml } from '../src/html.ts'
import { streamingMarkdownExtension } from '../src/extensions/streaming.ts'
import { escapeHtml } from '../src/utils.ts'

function optionsFor(base, options) {
  return options === undefined ? base : { ...options, extensions: [...base.extensions, ...(options.extensions ?? [])] }
}

export function createBaselineRenderer() {
  const base = { extensions: [streamingMarkdownExtension()] }
  return { reset() {}, render(source, options) {
    return renderHtml(source, optionsFor(base, options))
  } }
}

export { createStreamingHtmlRenderer as createOwnedAppendRenderer } from '../src/html/streaming.ts'
