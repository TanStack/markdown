import type { InlineNode, ParseOptions } from './types.js'
import { footnoteId, normalizeReferenceLabel, parseDestination, plainText, sanitizeUrl } from './utils.js'

export function parseInline(value: string, options: ParseOptions = {}): InlineNode[] {
  let result = parseInlineRaw(value, options)

  for (const extension of options.extensions ?? []) {
    result = extension.transformInline?.(result, { options }) ?? result
  }

  return result
}

interface InlineParseBudget {
  scans: number
  depth: number
  links: number
}

const maxInlineDepth = 32
const scansPerCharacter = 16
const inlineMarker = /[\\`!\[_*~<]/g

function parseInlineRaw(
  value: string,
  options: ParseOptions,
  budget: InlineParseBudget = { scans: Math.max(value.length * scansPerCharacter, 1024), depth: 0, links: 0 },
): InlineNode[] {
  if (budget.depth >= maxInlineDepth) return value ? [{ type: 'text', value }] : []
  budget.depth++

  const nodes: InlineNode[] = []
  let index = 0
  let text = ''

  const pushText = () => {
    if (text) {
      nodes.push({ type: 'text', value: text })
      text = ''
    }
  }

  while (index < value.length) {
    const char = value[index]!
    const next = value[index + 1]

    if (char === '\\') {
      if (next === '\n') {
        pushText()
        nodes.push({ type: 'break' })
        index += 2
        continue
      }

      if (next && /[!-/:-@\[-`{-~]/.test(next)) {
        text += next
        index += 2
        continue
      }
    }

    if (char === '`') {
      const tickCount = countRun(value, index, '`')
      const close = findClosingRun(value, index + tickCount, '`', tickCount, budget)
      if (close !== -1) {
        pushText()
        nodes.push({
          type: 'inlineCode',
          // Strip one padding space at each end, except in an all-space span.
          value: value.slice(index + tickCount, close).replace(/\n/g, ' ').replace(/^ (?! *$)(.*) $/s, '$1'),
        })
        index = close + tickCount
        continue
      }
      text += value.slice(index, index + tickCount)
      index += tickCount
      continue
    }

    if (char === '[' || (char === '!' && next === '[')) {
      const image = char === '!'
      const footnote = next === '^' && parseFootnoteReference(value, index, options, budget)
      if (footnote) {
        pushText()
        nodes.push(footnote.node)
        budget.links++
        index = footnote.end
        continue
      }

      const parsed = parseLinkish(value, index + Number(image), options, budget)
      if (parsed) {
        const links = budget.links
        const children = parseInlineRaw(parsed.label, image ? (options.references ? { references: options.references } : {}) : options, budget)
        const nested = !image && budget.links !== links
        const href = sanitizeUrl(parsed.href)
        if (image || (!nested && (href || !parsed.href))) {
          pushText()
          nodes.push({
            ...(image ? { type: 'image' as const, src: href, alt: plainText(children) } : { type: 'link' as const, href, children }),
            ...(parsed.title ? { title: parsed.title } : {}),
          })
        } else {
          if (nested) text += '['
          for (const child of children) {
            if (child.type === 'text') text += child.value
            else {
              pushText()
              nodes.push(child)
            }
          }
        }
        // An inner link disables its outer opener, but not the trailing markup.
        budget.links = image ? links : budget.links + 1
        index = nested ? index + parsed.label.length + 1 : parsed.end
        continue
      }
    }

    if (char === '*' && next === '*' && value[index + 2] === '*') {
      const close = findDelimiter(value, index + 3, '***', budget)
      if (close !== -1) {
        pushText()
        nodes.push({
          type: 'emphasis',
          children: parseInlineRaw(value.slice(index + 1, close + 2), options, budget),
        })
        index = close + 3
        continue
      }
    }

    if (char === '~' && next === '~' && value[index + 2] === '~') {
      const run = countRun(value, index, '~')
      text += value.slice(index, index + run)
      index += run
      continue
    }

    if (char === '*' || char === '_' || char === '~') {
      const size = next === char ? 2 : 1
      const close = char === '_' && !canUseUnderscore(value, index, size, true) ? -1 : findDelimiter(value, index + size, char.repeat(size), budget)
      if (close !== -1) {
        pushText()
        nodes.push({
          type: char === '~' ? 'strike' : size === 2 ? 'strong' : 'emphasis',
          children: parseInlineRaw(value.slice(index + size, close), options, budget),
        })
        index = close + size
      } else {
        text += char.repeat(size)
        index += size
      }
      continue
    }

    if (char === '<' && options.allowHtml) {
      const close = findCharacter(value, index + 1, '>', budget)
      if (close !== -1 && isInlineHtml(value.slice(index, close + 1))) {
        pushText()
        nodes.push({ type: 'inlineHtml', value: value.slice(index, close + 1) })
        index = close + 1
        continue
      }
    }

    // Reset after recursive parsing; exhausted budgets still allow escapes.
    inlineMarker.lastIndex = index + 1
    const end = budget.scans > 0 ? inlineMarker.exec(value)?.index ?? value.length : value.indexOf('\\', index + 1)
    text += value.slice(index, end < 0 ? value.length : end)
    index = end < 0 ? value.length : end
  }

  pushText()
  budget.depth--
  return nodes
}

interface ParsedFootnoteReference {
  node: InlineNode
  end: number
}

interface ParsedLink {
  label: string
  href: string
  title?: string
  end: number
}

function parseFootnoteReference(value: string, open: number, options: ParseOptions, budget: InlineParseBudget): ParsedFootnoteReference | undefined {
  const close = findCharacter(value, open + 2, ']', budget)
  if (close === -1) return undefined

  const label = value.slice(open + 2, close)
  const key = normalizeReferenceLabel(label)
  const definition = options.footnotes?.[key]
  if (!definition || !options.footnoteOrder) return undefined

  let number = options.footnoteOrder.indexOf(key) + 1
  if (!number) number = options.footnoteOrder.push(key)

  const referenceIndex = (options.footnoteCounts?.[key] ?? 0) + 1
  if (options.footnoteCounts) options.footnoteCounts[key] = referenceIndex

  return {
    node: {
      type: 'footnoteReference',
      id: definition.id ?? footnoteId(definition.label),
      number,
      ...(referenceIndex > 1 ? { referenceIndex } : {}),
    },
    end: close + 1,
  }
}

function parseLinkish(value: string, open: number, options: ParseOptions, budget: InlineParseBudget): ParsedLink | undefined {
  const closeBracket = findBalanced(value, open, '[', ']', budget)
  if (closeBracket === -1) return undefined

  const label = value.slice(open + 1, closeBracket)
  let end = closeBracket + 1
  let definition: { href: string; title?: string } | undefined

  if (value[end] === '(') {
    const closeParen = findBalanced(value, end, '(', ')', budget)
    if (closeParen === -1) return undefined

    definition = parseDestination(value.slice(end + 1, closeParen).trim())
    end = closeParen + 1
  } else if (value[end] === '[') {
    const closeReference = findBalanced(value, end, '[', ']', budget)
    if (closeReference === -1) return undefined

    definition = options.references?.[normalizeReferenceLabel(value.slice(end + 1, closeReference) || label)]
    end = closeReference + 1
  } else {
    definition = options.references?.[normalizeReferenceLabel(label)]
  }

  if (definition) {
    return {
      ...definition,
      label,
      end,
    }
  }

  return undefined
}

function isInlineHtml(value: string): boolean {
  return /^<(?:!--(?:[\s\S]*--|-?)|\?[\s\S]*\?|![A-Z][\s\S]*|!\[CDATA\[[\s\S]*\]\]|\/[A-Za-z][\w:-]*\s*|[A-Za-z][\w:-]*(?:\s+[A-Za-z_:][\w:.-]*(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*\s*\/?)>$/.test(value)
}

function findBalanced(value: string, openIndex: number, open: string, close: string, budget: InlineParseBudget): number {
  // Reject missing closers with a native search, charging the same shared budget.
  if (findCharacter(value, openIndex + 1, close, budget) === -1) return -1
  let depth = 0
  for (let index = openIndex; index < value.length; index++) {
    if (--budget.scans < 0) return -1
    if (value[index] === '\\') {
      index++
      continue
    }
    if (value[index] === open) depth++
    if (value[index] === close) {
      depth--
      if (depth === 0) return index
    }
  }
  return -1
}

function countRun(value: string, index: number, char: string, budget?: InlineParseBudget): number {
  let count = 0
  while (value[index + count] === char) {
    if (budget && --budget.scans < 0) break
    count++
  }
  return count
}

function findClosingRun(value: string, start: number, char: string, count: number, budget: InlineParseBudget): number {
  let index = start
  while ((index = findCharacter(value, index, char, budget)) !== -1) {
    const size = countRun(value, index, char, budget)
    if (size === count) return index
    index += size
  }
  return -1
}

function findDelimiter(value: string, start: number, delimiter: string, budget: InlineParseBudget): number {
  if (delimiter === '~' && /[\s\d]/.test(value[start] ?? '')) return -1
  for (let index = start; index < value.length; index++) {
    if (--budget.scans < 0) return -1
    if (value[index] === '\\') {
      index++
      continue
    }
    if (!value.startsWith(delimiter, index)) continue
    if (delimiter[0] === '~') {
      if (value[index - 1] === '~' || value[index + delimiter.length] === '~') continue
      if (delimiter === '~' && /\s/.test(value[index - 1] ?? '')) return -1
    } else if (value[index + 1] === delimiter) {
      const size = countRun(value, index, delimiter, budget)
      const close = findDelimiter(value, index + size, delimiter.repeat(size), budget)
      if (close > index + size) {
        index = close + size - 1
        continue
      }
    }
    if (delimiter[0] === '_' && !canUseUnderscore(value, index, delimiter.length, false)) continue
    return index
  }
  return -1
}

function findCharacter(value: string, start: number, character: string, budget: InlineParseBudget): number {
  if (budget.scans <= 0) return -1
  const index = value.indexOf(character, start)
  budget.scans -= (index < 0 ? value.length : index + 1) - start
  return budget.scans < 0 ? -1 : index
}

function canUseUnderscore(value: string, index: number, size: number, opening: boolean): boolean {
  const inside = value[opening ? index + size : index - 1]
  const outside = value[opening ? index - 1 : index + size]
  return inside !== undefined && !/\s/.test(inside) && (outside === undefined || /[^\p{L}\p{N}]/u.test(outside))
}
