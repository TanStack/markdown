import type { InlineNode, ParseOptions } from './types.js'
import { footnoteId, normalizeReferenceLabel, sanitizeUrl } from './utils.js'

export function parseInline(value: string, options: ParseOptions = {}): InlineNode[] {
  const nodes = parseInlineRaw(value, options)
  let result = mergeText(nodes)

  for (const extension of options.extensions ?? []) {
    result = extension.transformInline?.(result, { options }) ?? result
  }

  return result
}

interface InlineParseBudget {
  scans: number
  depth: number
}

const maxInlineDepth = 32
const scansPerCharacter = 16

function parseInlineRaw(
  value: string,
  options: ParseOptions,
  budget: InlineParseBudget = { scans: Math.max(value.length * scansPerCharacter, 1024), depth: 0 },
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

      if (next && /[\\`*_[\]{}()#+\-.!|~>]/.test(next)) {
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
          value: value.slice(index + tickCount, close).replace(/\s+/g, ' ').trim(),
        })
        index = close + tickCount
        continue
      }
      text += value.slice(index, index + tickCount)
      index += tickCount
      continue
    }

    if (char === '!' && next === '[') {
      const parsed = parseLinkish(value, index + 1, options, budget)
      if (parsed) {
        pushText()
        nodes.push({
          type: 'image',
          src: sanitizeUrl(parsed.href),
          alt: textFromMarkdown(parsed.label, budget),
          ...(parsed.title ? { title: parsed.title } : {}),
        })
        index = parsed.end
        continue
      }
    }

    if (char === '[') {
      const footnote = parseFootnoteReference(value, index, options, budget)
      if (footnote) {
        pushText()
        nodes.push(footnote.node)
        index = footnote.end
        continue
      }

      const parsed = parseLinkish(value, index, options, budget)
      if (parsed) {
        const href = sanitizeUrl(parsed.href)
        pushText()
        if (href) {
          nodes.push({
            type: 'link',
            href,
            ...(parsed.title ? { title: parsed.title } : {}),
            children: parseInlineRaw(parsed.label, options, budget),
          })
        } else {
          nodes.push(...parseInlineRaw(parsed.label, options, budget))
        }
        index = parsed.end
        continue
      }
    }

    if ((char === '*' && next === '*') || (char === '_' && next === '_')) {
      const close = findDelimiter(value, index + 2, char + char, budget)
      if (close !== -1) {
        pushText()
        nodes.push({
          type: 'strong',
          children: parseInlineRaw(value.slice(index + 2, close), options, budget),
        })
        index = close + 2
        continue
      }
      text += char + next
      index += 2
      continue
    }

    if (char === '~' && next === '~' && value[index + 2] === '~') {
      const run = countRun(value, index, '~')
      text += value.slice(index, index + run)
      index += run
      continue
    }

    if (char === '~' && next === '~') {
      const close = findDelimiter(value, index + 2, '~~', budget)
      if (close !== -1) {
        pushText()
        nodes.push({
          type: 'strike',
          children: parseInlineRaw(value.slice(index + 2, close), options, budget),
        })
        index = close + 2
        continue
      }
      text += '~~'
      index += 2
      continue
    }

    if (char === '~') {
      const close = findSingleTildeDelimiter(value, index + 1, budget)
      if (close !== -1) {
        pushText()
        nodes.push({
          type: 'strike',
          children: parseInlineRaw(value.slice(index + 1, close), options, budget),
        })
        index = close + 1
        continue
      }
    }

    if (char === '*' || char === '_') {
      const close = findDelimiter(value, index + 1, char, budget)
      if (close !== -1 && !isIntrawordUnderscore(value, index, close, char)) {
        pushText()
        nodes.push({
          type: 'emphasis',
          children: parseInlineRaw(value.slice(index + 1, close), options, budget),
        })
        index = close + 1
        continue
      }
    }

    if (char === '<' && options.allowHtml) {
      const close = findCharacter(value, index + 1, '>', budget)
      if (close !== -1) {
        pushText()
        nodes.push({ type: 'inlineHtml', value: value.slice(index, close + 1) })
        index = close + 1
        continue
      }
    }

    text += char
    index++
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
  if (value[open + 1] !== '^') return undefined

  const close = findCharacter(value, open + 2, ']', budget)
  if (close === -1) return undefined

  const label = value.slice(open + 2, close)
  const key = normalizeReferenceLabel(label)
  const definition = options.footnotes?.[key]
  if (!definition || !options.footnoteOrder) return undefined

  let orderIndex = options.footnoteOrder.indexOf(key)
  if (orderIndex === -1) {
    options.footnoteOrder.push(key)
    orderIndex = options.footnoteOrder.length - 1
  }

  const referenceIndex = (options.footnoteCounts?.[key] ?? 0) + 1
  if (options.footnoteCounts) options.footnoteCounts[key] = referenceIndex

  return {
    node: {
      type: 'footnoteReference',
      id: definition.id ?? (footnoteId(definition.label) || 'footnote'),
      number: orderIndex + 1,
      ...(referenceIndex > 1 ? { referenceIndex } : {}),
    },
    end: close + 1,
  }
}

function parseLinkish(value: string, open: number, options: ParseOptions, budget: InlineParseBudget): ParsedLink | undefined {
  const closeBracket = findBalanced(value, open, '[', ']', budget)
  if (closeBracket === -1) return undefined

  const label = value.slice(open + 1, closeBracket)

  if (value[closeBracket + 1] === '(') {
    const closeParen = findBalanced(value, closeBracket + 1, '(', ')', budget)
    if (closeParen === -1) return undefined

    const destination = value.slice(closeBracket + 2, closeParen).trim()
    const parsed = parseDestination(destination)
    if (!parsed) return undefined

    return {
      label,
      href: parsed.href,
      ...(parsed.title ? { title: parsed.title } : {}),
      end: closeParen + 1,
    }
  }

  if (value[closeBracket + 1] === '[') {
    const closeReference = findBalanced(value, closeBracket + 1, '[', ']', budget)
    if (closeReference === -1) return undefined

    const definition = options.references?.[normalizeReferenceLabel(value.slice(closeBracket + 2, closeReference))]
    if (!definition) return undefined

    return {
      label,
      href: definition.href,
      ...(definition.title ? { title: definition.title } : {}),
      end: closeReference + 1,
    }
  }

  return undefined
}

function parseDestination(value: string): { href: string; title?: string } {
  const match = value.match(/^(\S+)(?:\s+["']([^"']*)["'])?$/)
  if (!match) return { href: value }
  return {
    href: match[1]!.replace(/^<|>$/g, ''),
    ...(match[2] ? { title: match[2] } : {}),
  }
}

function findBalanced(value: string, openIndex: number, open: string, close: string, budget: InlineParseBudget): number {
  let depth = 0
  for (let index = openIndex; index < value.length; index++) {
    if (!takeScan(budget)) return -1
    if (value[index - 1] === '\\') continue
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
    if (budget && !takeScan(budget)) break
    count++
  }
  return count
}

function findClosingRun(value: string, start: number, char: string, count: number, budget: InlineParseBudget): number {
  for (let index = start; index < value.length; index++) {
    if (!takeScan(budget)) return -1
    if (value[index] !== char) continue
    if (countRun(value, index, char, budget) >= count) return index
  }
  return -1
}

function findDelimiter(value: string, start: number, delimiter: string, budget: InlineParseBudget): number {
  for (let index = start; index < value.length; index++) {
    if (!takeScan(budget)) return -1
    if (value[index - 1] === '\\') continue
    if (delimiter === '~~' && (value[index - 1] === '~' || value[index + 2] === '~')) continue
    if (value.startsWith(delimiter, index)) return index
  }
  return -1
}

function findSingleTildeDelimiter(value: string, start: number, budget: InlineParseBudget): number {
  if (isWhitespace(value[start] ?? '')) return -1

  for (let index = start; index < value.length; index++) {
    if (!takeScan(budget)) return -1
    if (value[index - 1] === '\\') continue
    if (value[index] !== '~') continue
    if (value[index - 1] === '~') continue
    if (value[index + 1] === '~') continue
    if (isWhitespace(value[index - 1] ?? '')) return -1
    return index
  }

  return -1
}

function findCharacter(value: string, start: number, character: string, budget: InlineParseBudget): number {
  for (let index = start; index < value.length; index++) {
    if (!takeScan(budget)) return -1
    if (value[index] === character) return index
  }
  return -1
}

function takeScan(budget: InlineParseBudget): boolean {
  if (budget.scans <= 0) return false
  budget.scans--
  return true
}

function isIntrawordUnderscore(value: string, open: number, close: number, delimiter: string): boolean {
  if (delimiter !== '_') return false
  return /\w/.test(value[open - 1] ?? '') && /\w/.test(value[close + 1] ?? '')
}

function isWhitespace(value: string): boolean {
  return /\s/.test(value)
}

function textFromMarkdown(value: string, budget: InlineParseBudget): string {
  return parseInlineRaw(value, {}, budget).map(node => (node.type === 'text' || node.type === 'inlineCode' ? node.value : '')).join('')
}


function mergeText(nodes: InlineNode[]): InlineNode[] {
  const result: InlineNode[] = []
  for (const node of nodes) {
    const previous = result.at(-1)
    if (previous?.type === 'text' && node.type === 'text') {
      previous.value += node.value
    } else {
      result.push(node)
    }
  }
  return result
}
