import { parseInline } from './inline.js'
import type {
  BlockNode,
  CodeBlockNode,
  FootnoteItemNode,
  HeadingNode,
  InlineNode,
  ListItemNode,
  ListNode,
  MarkdownDocument,
  ParseOptions,
  TableCellNode,
  TableNode,
} from './types.js'
import { createSlugger, footnoteId, isBlank, normalizeInput, normalizeReferenceLabel, plainText, stripIndent } from './utils.js'

type Slugger = ReturnType<typeof createSlugger>

interface BlockParseBudget {
  depth: number
}

const maxBlockDepth = 64

export function parseMarkdown(markdown: string, options: ParseOptions = {}): MarkdownDocument {
  const normalized = normalizeInput(markdown)
  const frontmatterEnabled = options.frontmatter !== false
  let lines = normalized.split('\n')
  let frontmatter: string | undefined

  if (frontmatterEnabled && lines[0] === '---') {
    const end = lines.findIndex((line, index) => index > 0 && line === '---')
    if (end > 0) {
      frontmatter = lines.slice(1, end).join('\n')
      lines = lines.slice(end + 1)
    }
  }

  const definitions = extractDefinitions(lines)
  lines = definitions.lines
  const footnoteOrder: string[] = []
  const footnoteCounts: Record<string, number> = Object.create(null)
  const hasReferences = Object.keys(definitions.references).length > 0
  const hasFootnotes = Object.keys(definitions.footnotes).length > 0
  const parseOptions =
    hasReferences || hasFootnotes
      ? {
          ...options,
          ...(hasReferences ? { references: definitions.references } : {}),
          ...(hasFootnotes ? { footnotes: definitions.footnotes, footnoteOrder, footnoteCounts } : {}),
        }
      : options

  const parser = new BlockParser(lines, parseOptions, createSlugger())
  const children = parser.parse()
  if (hasFootnotes && footnoteOrder.length > 0) {
    children.push(createFootnotesBlock(definitions.footnotes, footnoteOrder, parseOptions))
  }
  let document: MarkdownDocument = frontmatter === undefined ? { type: 'root', children } : { type: 'root', frontmatter, children }

  for (const extension of parseOptions.extensions ?? []) {
    document = extension.transformDocument?.(document, { options: parseOptions }) ?? document
  }

  return document
}

class BlockParser {
  private index = 0

  constructor(
    private readonly lines: string[],
    private readonly options: ParseOptions,
    private readonly slugger: Slugger,
    private readonly budget: BlockParseBudget = { depth: 0 },
  ) {}

  parse(): BlockNode[] {
    if (this.budget.depth >= maxBlockDepth) {
      const value = this.lines.slice(this.index).join('\n')
      this.index = this.lines.length
      return value ? [{ type: 'paragraph', children: parseInline(value, this.options) }] : []
    }

    this.budget.depth++
    const nodes: BlockNode[] = []

    while (this.index < this.lines.length) {
      if (isBlank(this.current())) {
        this.index++
        continue
      }

      const extensionNode = this.parseExtensionBlock()
      if (extensionNode) {
        nodes.push(extensionNode)
        continue
      }

      const node =
        this.parseFence() ??
        this.parseHeading() ??
        this.parseThematicBreak() ??
        this.parseBlockquote() ??
        this.parseList() ??
        this.parseTable() ??
        this.parseHtmlBlock() ??
        this.parseParagraph()

      nodes.push(node)
    }

    this.budget.depth--
    return nodes
  }

  private parseExtensionBlock(): BlockNode | undefined {
    for (const extension of this.options.extensions ?? []) {
      let consumed = 0
      const node = extension.parseBlock?.({
        lines: this.lines,
        index: this.index,
        options: this.options,
        parseInline: value => parseInline(value, this.options),
        parseBlocks: value => new BlockParser(normalizeInput(value).split('\n'), this.options, this.slugger, this.budget).parse(),
        consume: lines => {
          consumed = lines
        },
      })

      if (node) {
        this.index += Math.max(consumed, 1)
        return node
      }
    }

    return undefined
  }

  private parseFence(): CodeBlockNode | undefined {
    const match = this.current().match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (!match) return undefined

    const fence = match[1]!
    const marker = fence[0]!
    const fenceSize = fence.length
    const info = match[2]!.trim()
    const code: string[] = []
    this.index++

    while (this.index < this.lines.length) {
      const line = this.current()
      const close = line.match(/^ {0,3}(`{3,}|~{3,})\s*$/)
      if (close && close[1]![0] === marker && close[1]!.length >= fenceSize) {
        this.index++
        break
      }
      code.push(line)
      this.index++
    }

    return {
      type: 'code',
      value: code.join('\n'),
      ...parseCodeInfo(info),
    }
  }

  private parseHeading(): HeadingNode | undefined {
    const match = this.current().match(/^ {0,3}(#{1,6})(?:\s+|$)(.*?)\s*#*\s*$/)
    if (!match) return undefined

    const depth = match[1]!.length as HeadingNode['depth']
    const children = parseInline(match[2]!.trim(), this.options)
    const id = this.createHeadingId(children)
    this.index++

    return id ? { type: 'heading', depth, id, children } : { type: 'heading', depth, children }
  }

  private parseThematicBreak(): BlockNode | undefined {
    if (!/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(this.current())) return undefined
    this.index++
    return { type: 'thematicBreak' }
  }

  private parseBlockquote(): BlockNode | undefined {
    if (!/^ {0,3}>\s?/.test(this.current())) return undefined

    const quoted: string[] = []
    while (this.index < this.lines.length) {
      const line = this.current()
      if (isBlank(line)) {
        quoted.push('')
        this.index++
        continue
      }

      const match = line.match(/^ {0,3}>\s?(.*)$/)
      if (!match) break
      quoted.push(match[1]!)
      this.index++
    }

    return {
      type: 'blockquote',
      children: new BlockParser(quoted, this.options, this.slugger, this.budget).parse(),
    }
  }

  private parseList(): ListNode | undefined {
    const first = listMarker(this.current())
    if (!first) return undefined

    const items: ListItemNode[] = []
    const ordered = first.ordered
    const baseIndent = first.indent
    const start = ordered ? first.number : undefined
    let loose = false

    while (this.index < this.lines.length) {
      const marker = listMarker(this.current())
      if (!marker || !sameListType(marker, first) || marker.indent !== baseIndent) break

      let firstLine = marker.content
      const task = firstLine.match(/^\[([ xX])\]\s+(.*)$/)
      const checked = task ? task[1]!.toLowerCase() === 'x' : undefined
      if (task) firstLine = task[2]!

      const itemLines = [firstLine]
      this.index++

      while (this.index < this.lines.length) {
        const line = this.current()
        const nextMarker = listMarker(line)
        if (nextMarker && nextMarker.indent === baseIndent) break
        if (isBlank(line)) {
          let nextIndex = this.index
          while (nextIndex < this.lines.length && isBlank(this.lines[nextIndex]!)) nextIndex++
          const following = this.lines[nextIndex]
          if (following === undefined) break

          const followingMarker = listMarker(following)
          if (followingMarker?.indent === baseIndent) {
            if (!sameListType(followingMarker, first)) break
            loose = true
            this.index = nextIndex
            break
          }

          if (leadingSpaces(following) < marker.contentIndent) break

          loose = true
          itemLines.push('')
          this.index = nextIndex
          continue
        }
        if (leadingSpaces(line) >= marker.contentIndent) {
          itemLines.push(stripIndent(line, marker.contentIndent))
          this.index++
          continue
        }
        if (isBlockStart(line, this.next())) break
        itemLines.push(line.trimStart())
        this.index++
      }

      const children = new BlockParser(itemLines, this.options, this.slugger, this.budget).parse()
      const item: ListItemNode = { type: 'listItem', children }
      if (checked !== undefined) item.checked = checked
      items.push(item)
    }

    return {
      type: 'list',
      ordered,
      ...(ordered && start !== undefined ? { start } : {}),
      ...(loose && { loose: true }),
      items,
    }
  }

  private parseTable(): TableNode | undefined {
    const header = this.current()
    const delimiter = this.next()
    if (!delimiter || !looksLikeTableHeader(header, delimiter)) return undefined

    const headerCells = splitTableRow(header)
    const align = splitTableRow(delimiter).map(parseAlign)
    const columns = headerCells.length
    const rows: TableCellNode[][] = []
    this.index += 2

    while (this.index < this.lines.length) {
      const line = this.current()
      if (isBlank(line) || isBlockStart(line, this.next())) break
      const values = splitTableRow(line)
      rows.push(Array.from({ length: columns }, (_, index) => cell(values[index] ?? '', this.options)))
      this.index++
    }

    return {
      type: 'table',
      align,
      header: headerCells.map(value => cell(value, this.options)),
      rows,
    }
  }

  private parseHtmlBlock(): BlockNode | undefined {
    if (!this.options.allowHtml || !/^ {0,3}<([A-Za-z][\w:-]*|!--|\/[A-Za-z])/.test(this.current())) return undefined

    const html: string[] = []
    while (this.index < this.lines.length && !isBlank(this.current())) {
      html.push(this.current())
      this.index++
    }

    return { type: 'html', value: html.join('\n') }
  }

  private parseParagraph(): BlockNode {
    const lines: string[] = []

    while (this.index < this.lines.length) {
      const line = this.current()
      if (isBlank(line)) break
      if (lines.length > 0 && isBlockStart(line, this.next())) break
      lines.push(line.trim())
      this.index++
    }

    return {
      type: 'paragraph',
      children: parseInline(lines.join('\n'), this.options),
    }
  }

  private createHeadingId(children: InlineNode[]): string | undefined {
    if (this.options.headingIds === false) return undefined
    const text = plainText(children)
    if (typeof this.options.headingIds === 'function') return this.options.headingIds(text, this.index)
    return this.slugger(text)
  }

  private current(): string {
    return this.lines[this.index] ?? ''
  }

  private next(): string | undefined {
    return this.lines[this.index + 1]
  }
}

function parseCodeInfo(info: string): Omit<CodeBlockNode, 'type' | 'value'> {
  if (!info) return {}

  const langMatch = info.match(/^([A-Za-z0-9_+.#-]+)/)
  const lang = langMatch?.[1]
  const meta = lang ? info.slice(lang.length).trim() : info
  const titleMatch = meta.match(/(?:^|\s)(?:title|file)=(?:"([^"]+)"|'([^']+)'|([^\s}]+))/)
  const frameworkMatch = meta.match(/(?:^|\s)framework=(?:"([^"]+)"|'([^']+)'|([^\s}]+))/)
  const rangeMatch = meta.match(/\{([^}]+)\}|(?:^|\s)lines=([^\s]+)/)
  const highlightLines = parseLineRanges(rangeMatch?.[1] ?? rangeMatch?.[2] ?? '')
  const title = titleMatch ? titleMatch[1] ?? titleMatch[2] ?? titleMatch[3] : undefined
  const framework = frameworkMatch ? frameworkMatch[1] ?? frameworkMatch[2] ?? frameworkMatch[3] : undefined

  return {
    ...(lang ? { lang } : {}),
    ...(meta ? { meta } : {}),
    ...(title ? { title, file: title } : {}),
    ...(framework ? { framework: framework.toLowerCase() } : {}),
    ...(highlightLines.length ? { highlightLines } : {}),
  }
}

function extractDefinitions(lines: string[]) {
  const references: NonNullable<ParseOptions['references']> = Object.create(null)
  const footnotes: NonNullable<ParseOptions['footnotes']> = Object.create(null)
  const footnoteIds = new Map<string, number>()
  const remaining: string[] = []
  let fenceMarker: string | undefined
  let fenceSize = 0
  let index = 0

  while (index < lines.length) {
    const line = lines[index]!
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/)
    if (fence) {
      const marker = fence[1]![0]!
      if (!fenceMarker) {
        fenceMarker = marker
        fenceSize = fence[1]!.length
      } else if (marker === fenceMarker && fence[1]!.length >= fenceSize) {
        fenceMarker = undefined
        fenceSize = 0
      }
      remaining.push(line)
      index++
      continue
    }

    if (!fenceMarker) {
      const footnote = line.match(/^ {0,3}\[\^([^\]\n]+)\]:[ \t]*(.*)$/)
      if (footnote) {
        const label = footnote[1]!
        const content = [footnote[2] ?? '']
        index++

        while (index < lines.length) {
          const continuation = lines[index]!
          if (!/^(?: {4,}|\t)/.test(continuation)) break
          content.push(continuation.replace(/^(?: {4}|\t)/, ''))
          index++
        }

        const key = normalizeReferenceLabel(label)
        if (!footnotes[key]) {
          const baseId = footnoteId(label) || 'footnote'
          const count = (footnoteIds.get(baseId) ?? 0) + 1
          footnoteIds.set(baseId, count)
          footnotes[key] = { label, content: content.join('\n'), id: count === 1 ? baseId : `${baseId}-${count}` }
        }
        continue
      }

      const definition = line.match(
        /^ {0,3}\[([^\]\n]+)\]:[ \t]*(\S+)(?:[ \t]+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?[ \t]*$/,
      )
      if (definition) {
        const title = definition[3] ?? definition[4] ?? definition[5]
        references[normalizeReferenceLabel(definition[1]!)] = {
          href: definition[2]!.replace(/^<|>$/g, ''),
          ...(title !== undefined ? { title } : {}),
        }
        index++
        continue
      }
    }

    remaining.push(line)
    index++
  }

  return { lines: remaining, references, footnotes }
}

function createFootnotesBlock(
  footnotes: NonNullable<ParseOptions['footnotes']>,
  footnoteOrder: string[],
  options: ParseOptions,
): BlockNode {
  const items: FootnoteItemNode[] = []
  for (let index = 0; index < footnoteOrder.length; index++) {
    const key = footnoteOrder[index]!
    const definition = footnotes[key]
    if (!definition) continue
    items.push({
      id: definition.id ?? (footnoteId(definition.label) || 'footnote'),
      number: index + 1,
      children: new BlockParser(normalizeInput(definition.content).split('\n'), options, createSlugger()).parse(),
    })
  }
  for (const item of items) {
    const count = options.footnoteCounts?.[footnoteOrder[item.number - 1]!] ?? 1
    if (count > 1) item.referenceCount = count
  }
  return { type: 'footnotes', items }
}

function parseLineRanges(value: string): number[] {
  const lines = new Set<number>()
  for (const part of value.split(',')) {
    const match = part.trim().match(/^(\d+)(?:-(\d+))?$/)
    if (!match) continue
    const start = Number(match[1])
    const end = Number(match[2] ?? match[1])
    for (let line = start; line <= end && line < start + 1000; line++) lines.add(line)
  }
  return [...lines].sort((a, b) => a - b)
}

function listMarker(line: string):
  | {
      ordered: boolean
      number?: number
      indent: number
      marker: string
      contentIndent: number
      content: string
    }
  | undefined {
  const match = line.match(/^(\s{0,8})([-+*]|\d{1,9}[.)])(?:([ \t]+)(.*))?$/)
  if (!match) return undefined

  const marker = match[2]!
  const ordered = /\d/.test(marker[0]!)
  return {
    ordered,
    ...(ordered ? { number: Number.parseInt(marker, 10) } : {}),
    indent: match[1]!.length,
    marker: ordered ? marker.at(-1)! : marker,
    contentIndent: match[1]!.length + marker.length + (match[3]?.length ?? 1),
    content: match[4] ?? '',
  }
}

function sameListType(left: NonNullable<ReturnType<typeof listMarker>>, right: NonNullable<ReturnType<typeof listMarker>>): boolean {
  return left.ordered === right.ordered && left.marker === right.marker
}

function leadingSpaces(line: string): number {
  return line.match(/^ */)?.[0].length ?? 0
}

function isBlockStart(line: string, next?: string): boolean {
  return (
    /^ {0,3}(`{3,}|~{3,})/.test(line) ||
    /^ {0,3}#{1,6}(?:\s+|$)/.test(line) ||
    /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line) ||
    /^ {0,3}>\s?/.test(line) ||
    listMarker(line) !== undefined ||
    (!!next && looksLikeTableHeader(line, next))
  )
}

function looksLikeTableHeader(header: string, delimiter: string): boolean {
  if (!header.includes('|')) return false
  const cells = splitTableRow(delimiter)
  return cells.length === splitTableRow(header).length && cells.every(cell => /^:?-+:?$/.test(cell.trim()))
}

function splitTableRow(value: string): string[] {
  let row = value.trim()
  if (row.startsWith('|')) row = row.slice(1)
  if (row.endsWith('|')) row = row.slice(0, -1)

  const cells: string[] = []
  let current = ''
  for (let index = 0; index < row.length; index++) {
    const char = row[index]!
    if (char === '\\' && row[index + 1] === '|') {
      current += '|'
      index++
      continue
    }
    if (char === '|') {
      cells.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  cells.push(current.trim())
  return cells
}

function parseAlign(value: string): 'left' | 'center' | 'right' | undefined {
  const trimmed = value.trim()
  if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center'
  if (trimmed.endsWith(':')) return 'right'
  if (trimmed.startsWith(':')) return 'left'
  return undefined
}

function cell(value: string, options: ParseOptions): TableCellNode {
  return { type: 'tableCell', children: parseInline(value, options) }
}
