import type { InlineParseContext, InlineParseResult, MarkdownExtension } from '../types.js'

const protocol = /https?:\/\//iy
const boundary = /[\p{L}\p{N}_/@<\\]/u
const terminator = /[\s\u0000-\u0020\u007f<>"'`\\]/
const trailing = /[.,!?;:]/

/** Opt-in HTTP(S) links; leaves the core Markdown profile unchanged. */
export function autolinksExtension(): MarkdownExtension {
  return { name: 'autolinks', inlineParser: { markers: 'hH<', parse: parseAutolink } }
}

function parseAutolink({ source, index, options, inLink }: InlineParseContext): InlineParseResult | undefined {
  if (inLink) return
  const angle = source[index] === '<'
  if (!angle && index > 0 && boundary.test(source[index - 1]!)) return
  const start = index + Number(angle)
  protocol.lastIndex = start
  const match = protocol.exec(source)
  if (!match) return

  let end = protocol.lastIndex
  const depth = [0, 0, 0]
  while (end < source.length) {
    const char = source[end]!
    if (terminator.test(char)) break
    if (!angle) {
      const open = '([{'.indexOf(char)
      const close = ')]}'.indexOf(char)
      if (open !== -1) depth[open]!++
      if (close !== -1 && depth[close]!-- === 0) break
    }
    end++
  }
  if (!angle) while (end > protocol.lastIndex && trailing.test(source[end - 1]!)) end--

  const url = source.slice(start, end)
  const closed = !angle || source[end] === '>'
  const length = end + Number(angle && closed) - index
  // Consume malformed candidates literally so their suffixes are not rescanned.
  const literal: InlineParseResult = { length, node: { type: 'text', value: source.slice(index, index + length) } }
  if (!closed) return literal
  try {
    new URL(url)
  } catch {
    return literal
  }

  // Only validated http(s) source reaches this point, so the default is safe.
  // As with core links, an application's replacement is trusted.
  const href = options.urlTransform ? options.urlTransform(url, 'link', url) : url
  const label = { type: 'text' as const, value: url }
  return { length, node: href === null ? label : { type: 'link', href, children: [label] } }
}
