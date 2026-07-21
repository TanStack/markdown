import { Fragment, createElement } from 'react'
import type { ComponentType, ReactElement, ReactNode } from 'react'
import { parseMarkdown } from './parser.js'
import type { BlockNode, ComponentNode, FootnoteItemNode, InlineNode, MarkdownInput, RenderOptions, TableCellNode } from './types.js'

type ComponentMap = Partial<Record<string, string | ComponentType<any>>>

export interface MarkdownReactOptions extends RenderOptions {
  components?: ComponentMap
}

export interface MarkdownProps extends MarkdownReactOptions {
  children: MarkdownInput
}

export function Markdown({ children, ...options }: MarkdownProps): ReactElement {
  return createElement(Fragment, null, renderMarkdownReact(children, options))
}

export function renderMarkdownReact(input: MarkdownInput, options: MarkdownReactOptions = {}): ReactNode {
  const document = typeof input === 'string' ? parseMarkdown(input, options) : input
  return document.children.map((node, index) => renderBlockReact(node, options, `b:${index}`))
}

export function renderBlockReact(node: BlockNode, options: MarkdownReactOptions = {}, key?: string): ReactElement {
  switch (node.type) {
    case 'heading':
      return h(
        options,
        `h${node.depth}`,
        { key, ...(node.id ? { id: node.id } : {}), ...(node.framework ? { 'data-framework': node.framework } : {}) },
        renderInlines(node.children, options),
        renderHeadingAnchorReact(node.id, options),
      )
    case 'paragraph':
      return h(options, 'p', { key }, renderInlines(node.children, options))
    case 'code':
      return renderCodeBlockReact(node, options, key)
    case 'list': {
      const tag = node.ordered ? 'ol' : 'ul'
      return h(
        options,
        tag,
        { key, ...(node.ordered && node.start && node.start !== 1 ? { start: node.start } : {}) },
        node.items.map((item, index) =>
          h(options, 'li', { key: index }, renderListItemChildrenReact(item.children, item.checked, node.loose, options, `${index}`)),
        ),
      )
    }
    case 'blockquote':
      return h(options, 'blockquote', { key }, node.children.map((child, index) => renderBlockReact(child, options, `${key}:${index}`)))
    case 'table':
      return h(
        options,
        'table',
        { key },
        h(options, 'thead', null, h(options, 'tr', null, node.header.map((cell, index) => renderTableCellReact('th', cell, node.align[index], options, index)))),
        node.rows.length
          ? h(
              options,
              'tbody',
              null,
              node.rows.map((row, rowIndex) =>
                h(options, 'tr', { key: rowIndex }, row.map((cell, index) => renderTableCellReact('td', cell, node.align[index], options, index))),
              ),
            )
          : null,
      )
    case 'footnotes':
      return renderFootnotesReact(node.items, options, key)
    case 'thematicBreak':
      return h(options, 'hr', { key })
    case 'html':
      return options.allowHtml
        ? h(options, 'div', { key, dangerouslySetInnerHTML: { __html: node.value } })
        : h(options, 'p', { key }, node.value)
    case 'callout':
      return h(
        options,
        'div',
        { key, className: `markdown-alert markdown-alert-${node.kind.toLowerCase()}` },
        h(options, 'p', { className: 'markdown-alert-title' }, node.title),
        h(options, 'div', { className: 'markdown-alert-content' }, node.children.map((child, index) => renderBlockReact(child, options, `${key}:${index}`))),
      )
    case 'component':
      return renderComponentReact(node, options, key)
  }
}

export function renderInlineReact(node: InlineNode, options: MarkdownReactOptions = {}, key?: string): ReactNode {
  switch (node.type) {
    case 'text':
      return node.value
    case 'inlineCode':
      return h(options, 'code', { key }, node.value)
    case 'strong':
      return h(options, 'strong', { key }, renderInlines(node.children, options))
    case 'emphasis':
      return h(options, 'em', { key }, renderInlines(node.children, options))
    case 'strike':
      return h(options, 'del', { key }, renderInlines(node.children, options))
    case 'footnoteReference':
      return h(
        options,
        'sup',
        { key },
        h(
          options,
          'a',
          {
            id: `user-content-fnref-${footnoteReferenceId(node)}`,
            'data-footnote-ref': '',
            'aria-describedby': 'footnote-label',
            href: `#user-content-fn-${node.id}`,
          },
          node.number,
        ),
      )
    case 'link':
      return h(options, 'a', { key, href: node.href, ...(node.title ? { title: node.title } : {}) }, renderInlines(node.children, options))
    case 'image':
      return h(options, 'img', { key, src: node.src, alt: node.alt, ...(node.title ? { title: node.title } : {}) })
    case 'break':
      return h(options, 'br', { key })
    case 'inlineHtml':
      return options.allowHtml
        ? h(options, 'span', { key, dangerouslySetInnerHTML: { __html: node.value } })
        : node.value
  }
}

function renderInlines(nodes: InlineNode[], options: MarkdownReactOptions): ReactNode[] {
  return nodes.map((node, index) => renderInlineReact(node, options, `i:${index}`))
}

function renderCodeBlockReact(node: Extract<BlockNode, { type: 'code' }>, options: MarkdownReactOptions, key?: string): ReactElement {
  const lang = node.lang ?? 'plaintext'
  const highlighter = options.highlighter

  const codeProps = {
    className: `language-${lang}`,
  }

  const content = highlighter ? undefined : node.value

  const highlighted =
    highlighter
      ? {
          dangerouslySetInnerHTML: {
            __html: highlighter(node.value, lang, {
              ...(node.highlightLines && { highlightLines: node.highlightLines }),
              ...(options.codeLineNumbers !== undefined && { lineNumbers: options.codeLineNumbers }),
            }),
          },
        }
      : undefined

  const pre = h(
    options,
    'pre',
    {
      className: 'tm-code',
      'data-lang': lang,
      ...(node.title ? { 'data-code-title': node.title } : {}),
      ...(node.file ? { 'data-filename': node.file } : {}),
      ...(node.framework ? { 'data-framework': node.framework } : {}),
    },
    h(options, 'code', { ...codeProps, ...highlighted }, content),
  )

  if (!node.title) return h(options, Fragment, { key }, pre)

  return h(
    options,
    'figure',
    { key, className: 'tm-code-frame', 'data-lang': lang },
    h(options, 'figcaption', null, node.title),
    pre,
  )
}

function renderListItemChildrenReact(
  children: BlockNode[],
  checked: boolean | undefined,
  loose: boolean | undefined,
  options: MarkdownReactOptions,
  key: string,
): ReactNode[] {
  const [first, ...rest] = children
  const task =
    checked === undefined
      ? []
      : [
          h(options, 'input', {
            key: `${key}:checkbox`,
            type: 'checkbox',
            disabled: true,
            checked,
            readOnly: true,
          }),
          ' ',
        ]

  if (first?.type === 'paragraph') {
    const content = [...task, ...renderInlines(first.children, options)]
    return [
      ...(loose ? [h(options, 'p', { key: `${key}:paragraph` }, content)] : content),
      ...rest.flatMap((child, childIndex) => renderListChildReact(child, loose, options, `${key}:${childIndex + 1}`)),
    ]
  }

  return [...task, ...children.flatMap((child, childIndex) => renderListChildReact(child, loose, options, `${key}:${childIndex}`))]
}

function renderListChildReact(child: BlockNode, loose: boolean | undefined, options: MarkdownReactOptions, key: string): ReactNode[] {
  return !loose && child.type === 'paragraph' ? renderInlines(child.children, options) : [renderBlockReact(child, options, key)]
}

function renderTableCellReact(
  tag: 'td' | 'th',
  cell: TableCellNode,
  align: 'left' | 'center' | 'right' | undefined,
  options: MarkdownReactOptions,
  key: number,
): ReactElement {
  return h(options, tag, { key, ...(align ? { style: { textAlign: align } } : {}) }, renderInlines(cell.children, options))
}

function renderFootnotesReact(items: FootnoteItemNode[], options: MarkdownReactOptions, key?: string): ReactElement {
  return h(
    options,
    'section',
    { key, 'data-footnotes': '', className: 'footnotes' },
    h(options, 'h2', { id: 'footnote-label', className: 'sr-only' }, 'Footnotes', renderHeadingAnchorReact('footnote-label', options)),
    h(
      options,
      'ol',
      null,
      items.map(item => h(options, 'li', { key: item.id, id: `user-content-fn-${item.id}` }, renderFootnoteItemReact(item, options))),
    ),
  )
}

function renderFootnoteItemReact(item: FootnoteItemNode, options: MarkdownReactOptions): ReactNode[] {
  const lastIndex = item.children.length - 1
  const backrefs = renderFootnoteBackrefsReact(item, options)

  if (lastIndex < 0) return [h(options, 'p', { key: 'backref-wrapper' }, backrefs.slice(1))]

  return item.children.map((child, index) => {
    if (index === lastIndex && child.type === 'paragraph') {
      return h(options, 'p', { key: index }, renderInlines(child.children, options), backrefs)
    }
    return renderBlockReact(child, options, `${index}`)
  })
}

function renderFootnoteBackrefsReact(item: FootnoteItemNode, options: MarkdownReactOptions): ReactNode[] {
  const result: ReactNode[] = []
  for (let index = 1; index <= (item.referenceCount ?? 1); index++) {
    const referenceId = index === 1 ? item.id : `${item.id}-${index}`
    const label = index === 1 ? `${item.number}` : `${item.number}-${index}`
    result.push(
      ' ',
      h(
        options,
        'a',
        {
          key: index,
          'data-footnote-backref': '',
          'aria-label': `Back to reference ${label}`,
          className: 'data-footnote-backref',
          href: `#user-content-fnref-${referenceId}`,
        },
        '\u21a9',
      ),
    )
  }
  return result
}

function footnoteReferenceId(node: Extract<InlineNode, { type: 'footnoteReference' }>): string {
  return node.referenceIndex && node.referenceIndex > 1 ? `${node.id}-${node.referenceIndex}` : node.id
}

function h(options: MarkdownReactOptions, tag: string | typeof Fragment, props: Record<string, any> | null, ...children: ReactNode[]): ReactElement {
  const component = typeof tag === 'string' ? options.components?.[tag] ?? tag : tag
  return createElement(component, props, ...children)
}

function renderComponentReact(node: ComponentNode, options: MarkdownReactOptions, key?: string): ReactElement {
  const tag = node.tagName ?? 'md-comment-component'
  const props: Record<string, string> = {
    ...(node.properties ?? {}),
  }

  if (!node.tagName) {
    props['data-component'] = node.name
    if (!props['data-attributes']) props['data-attributes'] = JSON.stringify(node.attributes)
  }

  return h(options, tag, { key, ...props }, node.children.map((child, index) => renderBlockReact(child, options, `${key}:${index}`)))
}

function renderHeadingAnchorReact(id: string | undefined, options: MarkdownReactOptions): ReactNode {
  if (!id || !options.headingAnchors) return null

  const anchorOptions = typeof options.headingAnchors === 'object' ? options.headingAnchors : {}
  return h(
    options,
    'a',
    {
      href: `#${id}`,
      'aria-hidden': anchorOptions.ariaHidden ?? true,
      className: anchorOptions.className ?? 'anchor-heading anchor-heading-link',
      tabIndex: anchorOptions.tabIndex ?? -1,
    },
    anchorOptions.content ?? '#',
  )
}
