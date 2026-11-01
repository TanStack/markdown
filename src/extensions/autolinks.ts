import type { InlineParseContext, InlineParseResult, MarkdownExtension } from '../types.js'

const protocol = /https?:\/\//iy
const boundary = /(?<=[\p{L}\p{N}_/@<\\])/uy
const terminator = /[\s\u0000-\u0020\u007f<>"'`\\]/
const trailing = /[.,!?;:]/

/** Opt-in HTTP(S) links; leaves the core Markdown profile unchanged. */
export function autolinksExtension(): MarkdownExtension {
  return { name: 'autolinks', inlineParser: { markers: 'hH<', parse: parseAutolink } }
}

function parseAutolink({ source, index, options, inLink }: InlineParseContext): InlineParseResult | undefined {
  if (inLink) return
  const angle = source[index] === '<'
  boundary.lastIndex = index
  if (!angle && boundary.test(source)) return
  const start = index + Number(angle)
  protocol.lastIndex = start
  if (!protocol.test(source)) return

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
  let valid = closed
  if (valid) try {
    new URL(url)
  } catch {
    valid = false
  }

  // Consume malformed candidates literally so their suffixes are not rescanned.
  // Only validated URLs reach the application's trusted replacement policy.
  const href = valid ? options.urlTransform ? options.urlTransform(url, 'link', url) : url : null
  const label = { type: 'text' as const, value: valid ? url : source.slice(index, index + length) }
  return { length, node: href === null ? label : { type: 'link', href, children: [label] } }
}
