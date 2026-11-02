import { parseMarkdown } from './parser.js'
import type { BlockNode, ComponentNode, FootnoteItemNode, HeadingAnchorOptions, InlineComponentNode, InlineNode, MarkdownDocument, MarkdownInput, RenderOptions, TableCellNode } from './types.js'
import { escapeAttr, escapeHtml, footnoteReferenceId } from './utils.js'

export function renderHtml(input: MarkdownInput, options: RenderOptions = {}): string {
  const document = typeof input === 'string' ? parseMarkdown(input, options) : input
  const output: string[] = []
  writeSequence(document.children, writeBlock, options, output, '\n')
  return output.join('')
}

export function renderBlock(node: BlockNode, options: RenderOptions = {}): string {
  const output: string[] = []
  writeBlock(node, options, output)
  return output.join('')
}

function writeBlock(node: BlockNode, options: RenderOptions, output: string[]): void {
  const extension = renderExtension(node, options)
  if (extension !== undefined) {
    output.push(extension)
    return
  }
  switch (node.type) {
    case 'heading': {
      const id = node.id ? ` id="${escapeAttr(node.id)}"` : ''
      const framework = node.framework ? ` data-framework="${escapeAttr(node.framework)}"` : ''
      output.push(`<h${node.depth}${id}${framework}>`)
      writeSequence(node.children, writeInline, options, output)
      output.push(`${renderHeadingAnchor(node.id, options)}</h${node.depth}>`)
      return
    }
    case 'paragraph':
      writeInlineContainer('p', node.children, options, output)
      return
    case 'code':
      output.push(renderCodeBlock(node, options))
      return
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul'
      const start = node.ordered && node.start !== undefined && node.start !== 1 ? ` start="${node.start}"` : ''
      output.push(`<${tag}${start}>\n`)
      writeSequence(node.items, (item, _, target) => {
        target.push(`<li>${renderListItemChildren(item.children, item.checked, node.loose, options)}</li>`)
      }, options, output, '\n')
      output.push(`\n</${tag}>`)
      return
    }
    case 'blockquote':
      output.push('<blockquote>\n')
      writeSequence(node.children, writeBlock, options, output, '\n')
      output.push('\n</blockquote>')
      return
    case 'table':
      output.push('<table><thead><tr>')
      writeSequence(node.header, (cell, opts, target, index) => writeCell('th', cell, node.align[index], opts, target), options, output)
      output.push('</tr></thead>')
      if (node.rows.length) {
        output.push('<tbody>')
        writeSequence(node.rows, (row, opts, target) => {
          target.push('<tr>')
          writeSequence(row, (cell, cellOptions, cellTarget, index) => writeCell('td', cell, node.align[index], cellOptions, cellTarget), opts, target)
          target.push('</tr>')
        }, options, output)
        output.push('</tbody>')
      }
      output.push('</table>')
      return
    case 'footnotes':
      output.push(renderFootnotes(node.items, options))
      return
    case 'thematicBreak':
      output.push('<hr>')
      return
    case 'html':
      output.push(options.allowHtml ? node.value : escapeHtml(node.value))
      return
    case 'callout':
      output.push(renderCallout(node, options))
      return
    case 'component':
      output.push(renderComponent(node, options))
  }
}

export function renderInline(node: InlineNode, options: RenderOptions = {}): string {
  const output: string[] = []
  writeInline(node, options, output)
  return output.join('')
}

function writeInline(node: InlineNode, options: RenderOptions, output: string[]): void {
  const extension = renderExtension(node, options)
  if (extension !== undefined) {
    output.push(extension)
    return
  }
  switch (node.type) {
    case 'text':
      output.push(escapeHtml(node.value))
      return
    case 'inlineCode':
      output.push(`<code>${escapeHtml(node.value)}</code>`)
      return
    case 'strong':
      writeInlineContainer('strong', node.children, options, output)
      return
    case 'emphasis':
      writeInlineContainer('em', node.children, options, output)
      return
    case 'strike':
      writeInlineContainer('del', node.children, options, output)
      return
    case 'footnoteReference':
      output.push(`<sup><a id="user-content-fnref-${escapeAttr(footnoteReferenceId(node.id, node.referenceIndex))}" data-footnote-ref="" aria-describedby="footnote-label" href="#user-content-fn-${escapeAttr(node.id)}">${node.number}</a></sup>`)
      return
    case 'link':
      output.push(`<a href="${escapeAttr(node.href)}"${node.title ? ` title="${escapeAttr(node.title)}"` : ''}>`)
      writeSequence(node.children, writeInline, options, output)
      output.push('</a>')
      return
    case 'image':
      output.push(`<img src="${escapeAttr(node.src)}" alt="${escapeAttr(node.alt)}"${node.title ? ` title="${escapeAttr(node.title)}"` : ''}>`)
      return
    case 'break':
      output.push('<br>')
      return
    case 'inlineHtml':
      output.push(options.allowHtml ? node.value : escapeHtml(node.value))
      return
    case 'inlineComponent':
      output.push(renderComponent(node, options))
  }
}

export function renderDocument(document: MarkdownDocument, options: RenderOptions = {}): string {
  return renderHtml(document, options)
}

function renderInlines(nodes: InlineNode[], options: RenderOptions): string {
  const output: string[] = []
  writeSequence(nodes, writeInline, options, output)
  return output.join('')
}

function writeInlineContainer(tag: string, nodes: InlineNode[], options: RenderOptions, output: string[]): void {
  output.push(`<${tag}>`)
  writeSequence(nodes, writeInline, options, output)
  output.push(`</${tag}>`)
}

function writeSequence<T>(nodes: T[], write: (node: T, options: RenderOptions, output: string[], index: number) => void, options: RenderOptions, output: string[], separator = ''): void {
  const length = nodes.length
  for (let index = 0; index < length; index++) {
    if (index && separator) output.push(separator)
    if (index in nodes) write(nodes[index]!, options, output, index)
  }
}

function writeCell(tag: 'td' | 'th', cell: TableCellNode, align: 'left' | 'center' | 'right' | undefined, options: RenderOptions, output: string[]): void {
  const style = align ? ` style="text-align:${align}"` : ''
  output.push(`<${tag}${style}>`)
  writeSequence(cell.children, writeInline, options, output)
  output.push(`</${tag}>`)
}

function renderCodeBlock(node: Extract<BlockNode, { type: 'code' }>, options: RenderOptions): string {
  const lang = node.lang ?? 'plaintext'
  const preAttrs = `class="tm-code${options.codeLineNumbers ? ' tm-code--line-numbers' : ''}" data-lang="${escapeAttr(lang)}"`
    + (node.meta ? ` data-meta="${escapeAttr(node.meta)}"` : '')
    + (node.title ? ` data-code-title="${escapeAttr(node.title)}"` : '')
    + (node.file ? ` data-filename="${escapeAttr(node.file)}"` : '')
    + (node.framework ? ` data-framework="${escapeAttr(node.framework)}"` : '')
  const html = options.highlighter?.(node.value, lang, {
    ...(node.meta && { meta: node.meta }),
    ...(node.highlightLines && { highlightLines: node.highlightLines }),
    ...(options.codeLineNumbers !== undefined && { lineNumbers: options.codeLineNumbers }),
  }) ?? escapeHtml(node.value)

  const pre = `<pre ${preAttrs}><code class="language-${escapeAttr(lang)}">${html}</code></pre>`
  if (!node.title) return pre

  return `<figure class="tm-code-frame" data-lang="${escapeAttr(lang)}"><figcaption>${escapeHtml(node.title)}</figcaption>${pre}</figure>`
}

function renderListItemChildren(children: BlockNode[], checked: boolean | undefined, loose: boolean | undefined, options: RenderOptions): string {
  let result = checked === undefined ? '' : `<input type="checkbox" disabled${checked ? ' checked' : ''}> `
  for (let index = 0; index < children.length; index++) {
    const child = children[index]!
    if (child.type === 'paragraph' && (!loose || index === 0)) {
      result += renderInlines(child.children, options)
      if (loose) result = `<p>${result}</p>`
    } else result += (index ? '\n' : '') + renderBlock(child, options)
  }
  return result
}

function renderCallout(node: Extract<BlockNode, { type: 'callout' }>, options: RenderOptions): string {
  const kind = node.kind.toLowerCase()
  const children = node.children.map(child => renderBlock(child, options)).join('\n')
  return `<div class="markdown-alert markdown-alert-${escapeAttr(kind)}"><p class="markdown-alert-title">${escapeHtml(node.title)}</p><div class="markdown-alert-content">${children}</div></div>`
}

function renderFootnotes(items: FootnoteItemNode[], options: RenderOptions): string {
  const renderedItems = items.map(item => `<li id="user-content-fn-${escapeAttr(item.id)}">\n${renderFootnoteItem(item, options)}\n</li>`).join('\n')
  return `<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes${renderHeadingAnchor('footnote-label', options)}</h2>\n<ol>\n${renderedItems}\n</ol>\n</section>`
}

function renderFootnoteItem(item: FootnoteItemNode, options: RenderOptions): string {
  const backref = renderFootnoteBackrefs(item)
  const lastIndex = item.children.length - 1

  const result = item.children
    .map((child, index) => {
      if (index === lastIndex && child.type === 'paragraph') {
        return `<p>${renderInlines(child.children, options)}${backref}</p>`
      }
      return renderBlock(child, options)
    })
  if (item.children[lastIndex]?.type !== 'paragraph') result.push(`<p>${backref.trimStart()}</p>`)
  return result.join('\n')
}

function renderFootnoteBackrefs(item: FootnoteItemNode): string {
  let result = ''
  for (let index = 1; index <= (item.referenceCount ?? 1); index++) {
    const referenceId = footnoteReferenceId(item.id, index)
    const label = index === 1 ? `${item.number}` : `${item.number}-${index}`
    result += ` <a data-footnote-backref="" aria-label="Back to reference ${label}" class="data-footnote-backref" href="#user-content-fnref-${escapeAttr(referenceId)}">&#8617;</a>`
  }
  return result
}

function renderComponent(node: ComponentNode | InlineComponentNode, options: RenderOptions): string {
  const tag = node.tagName ?? (node.type === 'inlineComponent' ? 'span' : 'md-comment-component')
  const attrs = renderComponentAttrs(node)
  const children = node.type === 'inlineComponent'
    ? renderInlines(node.children, options)
    : node.children.map(child => renderBlock(child, options)).join('\n')
  return `<${tag}${attrs}>${children}</${tag}>`
}

function renderExtension(node: BlockNode | InlineNode, options: RenderOptions): string | undefined {
  for (const extension of options.extensions ?? []) {
    const rendered = extension.renderHtml?.(node, {
      options,
      renderBlock: block => renderBlock(block, options),
      renderInline: inline => renderInline(inline, options),
    })
    if (rendered !== undefined) return rendered
  }
  return undefined
}

function renderHeadingAnchor(id: string | undefined, options: RenderOptions): string {
  const headingAnchors = options.headingAnchors
  if (!id || !headingAnchors) return ''
  const anchorOptions = typeof headingAnchors === 'object' ? headingAnchors : {}
  return `<a href="#${escapeAttr(id)}" aria-hidden="${anchorOptions.ariaHidden ?? true}" class="${escapeAttr(anchorOptions.className ?? 'anchor-heading anchor-heading-link')}" tabindex="${anchorOptions.tabIndex ?? -1}">${escapeHtml(anchorOptions.content ?? '#')}</a>`
}

function renderComponentAttrs(node: ComponentNode | InlineComponentNode): string {
  const props: Record<string, string> = {
    ...node.properties,
  }

  if (!node.tagName) {
    props['data-component'] = node.name
    if (!props['data-attributes']) props['data-attributes'] = JSON.stringify(node.attributes)
  }

  return Object.entries(props).map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join('')
}
