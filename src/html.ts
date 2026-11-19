import { parseMarkdown } from './parser.js'
import type { BlockNode, ComponentNode, FootnoteItemNode, HeadingAnchorOptions, InlineComponentNode, InlineNode, MarkdownDocument, MarkdownInput, RenderOptions, TableCellNode } from './types.js'
import { escapeAttr, escapeHtml, footnoteReferenceId } from './utils.js'

export function renderHtml(input: MarkdownInput, options: RenderOptions = {}): string {
  return renderDocument(typeof input === 'string' ? parseMarkdown(input, options) : input, options)
}

export function renderBlock(node: BlockNode, options: RenderOptions = {}): string {
  const extension = renderExtension(node, options)
  if (extension !== undefined) return extension

  switch (node.type) {
    case 'heading': {
      const id = node.id ? ` id="${escapeAttr(node.id)}"` : ''
      const framework = node.framework ? ` data-framework="${escapeAttr(node.framework)}"` : ''
      return `<h${node.depth}${id}${framework}>${renderInlines(node.children, options)}${renderHeadingAnchor(node.id, options)}</h${node.depth}>`
    }
    case 'paragraph':
      return `<p>${renderInlines(node.children, options)}</p>`
    case 'code':
      return renderCodeBlock(node, options)
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul'
      const start = node.ordered && node.start !== undefined && node.start !== 1 ? ` start="${node.start}"` : ''
      const items = node.items.map(item => `<li>${renderListItemChildren(item.children, item.checked, node.loose, options)}</li>`).join('\n')
      return `<${tag}${start}>\n${items}\n</${tag}>`
    }
    case 'blockquote':
      return `<blockquote>\n${renderBlocks(node.children, options)}\n</blockquote>`
    case 'table': {
      const header = `<thead><tr>${node.header.map((cell, index) => renderTableCell('th', cell, node.align[index], options)).join('')}</tr></thead>`
      const body = node.rows.length
        ? `<tbody>${node.rows
            .map(row => `<tr>${row.map((cell, index) => renderTableCell('td', cell, node.align[index], options)).join('')}</tr>`)
            .join('')}</tbody>`
        : ''
      return `<table>${header}${body}</table>`
    }
    case 'footnotes':
      return renderFootnotes(node.items, options)
    case 'thematicBreak':
      return '<hr>'
    case 'html':
      return options.allowHtml ? node.value : escapeHtml(node.value)
    case 'callout': {
      const { open } = node
      const tag = open === undefined ? 'div' : 'details'
      const titleTag = open === undefined ? 'p' : 'summary'
      return `<${tag}${open ? ' open' : ''} class="markdown-alert markdown-alert-${escapeAttr(node.kind.toLowerCase())}"><${titleTag} class="markdown-alert-title">${escapeHtml(node.title)}</${titleTag}><div class="markdown-alert-content">${renderBlocks(node.children, options)}</div></${tag}>`
    }
    case 'component':
      return renderComponent(node, options)
  }
}

export function renderInline(node: InlineNode, options: RenderOptions = {}): string {
  const extension = renderExtension(node, options)
  if (extension !== undefined) return extension

  switch (node.type) {
    case 'text':
      return escapeHtml(node.value)
    case 'inlineCode':
      return `<code>${escapeHtml(node.value)}</code>`
    case 'strong':
      return `<strong>${renderInlines(node.children, options)}</strong>`
    case 'emphasis':
      return `<em>${renderInlines(node.children, options)}</em>`
    case 'strike':
      return `<del>${renderInlines(node.children, options)}</del>`
    case 'footnoteReference':
      return `<sup><a id="user-content-fnref-${escapeAttr(footnoteReferenceId(node.id, node.referenceIndex))}" data-footnote-ref="" aria-describedby="footnote-label" href="#user-content-fn-${escapeAttr(node.id)}">${node.number}</a></sup>`
    case 'link':
      return `<a href="${escapeAttr(node.href)}"${node.title ? ` title="${escapeAttr(node.title)}"` : ''}>${renderInlines(node.children, options)}</a>`
    case 'image':
      return `<img src="${escapeAttr(node.src)}" alt="${escapeAttr(node.alt)}"${node.title ? ` title="${escapeAttr(node.title)}"` : ''}>`
    case 'break':
      return '<br>'
    case 'inlineHtml':
      return options.allowHtml ? node.value : escapeHtml(node.value)
    case 'inlineComponent':
      return renderComponent(node, options)
  }
}

export function renderDocument(document: MarkdownDocument, options: RenderOptions = {}): string {
  return renderBlocks(document.children, options)
}

function renderBlocks(nodes: BlockNode[], options: RenderOptions): string {
  return nodes.map(node => renderBlock(node, options)).join('\n')
}

function renderInlines(nodes: InlineNode[], options: RenderOptions): string {
  return nodes.map(node => renderInline(node, options)).join('')
}

function renderCodeBlock(node: Extract<BlockNode, { type: 'code' }>, options: RenderOptions): string {
  const lang = node.lang ?? 'plaintext'
  const escapedLang = escapeAttr(lang)
  const preAttrs = `class="tm-code${options.codeLineNumbers ? ' tm-code--line-numbers' : ''}" data-lang="${escapedLang}"`
    + (node.meta ? ` data-meta="${escapeAttr(node.meta)}"` : '')
    + (node.title ? ` data-code-title="${escapeAttr(node.title)}"` : '')
    + (node.file ? ` data-filename="${escapeAttr(node.file)}"` : '')
    + (node.framework ? ` data-framework="${escapeAttr(node.framework)}"` : '')
  const html = options.highlighter?.(node.value, lang, {
    ...(node.meta && { meta: node.meta }),
    ...(node.highlightLines && { highlightLines: node.highlightLines }),
    ...(options.codeLineNumbers !== undefined && { lineNumbers: options.codeLineNumbers }),
  }) ?? escapeHtml(node.value)

  const pre = `<pre ${preAttrs}><code class="language-${escapedLang}">${html}</code></pre>`
  if (!node.title) return pre

  return `<figure class="tm-code-frame" data-lang="${escapedLang}"><figcaption>${escapeHtml(node.title)}</figcaption>${pre}</figure>`
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
  const props: Record<string, string> = {
    ...node.properties,
  }

  if (!node.tagName) {
    props['data-component'] = node.name
    if (!props['data-attributes']) props['data-attributes'] = JSON.stringify(node.attributes)
  }

  const attrs = Object.entries(props).map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join('')
  const children = node.type === 'inlineComponent'
    ? renderInlines(node.children, options)
    : renderBlocks(node.children, options)
  return `<${tag}${attrs}>${children}</${tag}>`
}

function renderTableCell(
  tag: 'td' | 'th',
  cell: TableCellNode,
  align: 'left' | 'center' | 'right' | undefined,
  options: RenderOptions,
): string {
  const style = align ? ` style="text-align:${align}"` : ''
  return `<${tag}${style}>${renderInlines(cell.children, options)}</${tag}>`
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
