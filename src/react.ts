import { Fragment, createElement } from 'react'
import type { ComponentPropsWithoutRef, ComponentType, JSX, ReactElement, ReactNode } from 'react'
import { parseMarkdown } from './parser.js'
import { footnoteReferenceId } from './utils.js'
import type { BlockNode, ComponentNode, FootnoteItemNode, InlineComponentNode, InlineNode, MarkdownInput, RenderOptions, TableCellNode } from './types.js'

type IntrinsicElementName = keyof JSX.IntrinsicElements
type ComponentMap = Partial<Record<string, string | ComponentType<any>>>

export type MarkdownComponentProps<TagName extends IntrinsicElementName> = ComponentPropsWithoutRef<TagName>

export type MarkdownComponents = Partial<{
  [TagName in IntrinsicElementName]: IntrinsicElementName | ComponentType<MarkdownComponentProps<TagName>>
}> &
  Record<string, string | ComponentType<any> | undefined>

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
        { key, ...(node.ordered && node.start !== undefined && node.start !== 1 ? { start: node.start } : {}) },
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
            id: `user-content-fnref-${footnoteReferenceId(node.id, node.referenceIndex)}`,
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
    case 'inlineComponent':
      return renderComponentReact(node, options, key)
  }
}

function renderInlines(nodes: InlineNode[], options: MarkdownReactOptions): ReactNode[] {
  return nodes.map((node, index) => renderInlineReact(node, options, `i:${index}`))
}

function renderCodeBlockReact(node: Extract<BlockNode, { type: 'code' }>, options: MarkdownReactOptions, key?: string): ReactElement {
  const lang = node.lang ?? 'plaintext'
  const highlighter = options.highlighter

  const content = highlighter ? undefined : node.value

  const highlighted =
    highlighter
      ? {
          dangerouslySetInnerHTML: {
            __html: highlighter(node.value, lang, {
              ...(node.meta && { meta: node.meta }),
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
      className: `tm-code${options.codeLineNumbers ? ' tm-code--line-numbers' : ''}`,
      'data-lang': lang,
      ...(node.meta ? { 'data-meta': node.meta } : {}),
      ...(node.title ? { 'data-code-title': node.title } : {}),
      ...(node.file ? { 'data-filename': node.file } : {}),
      ...(node.framework ? { 'data-framework': node.framework } : {}),
    },
    h(options, 'code', { className: `language-${lang}`, ...highlighted }, content),
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
  let result: ReactNode[] =
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

  for (let index = 0; index < children.length; index++) {
    const child = children[index]!
    if (child.type === 'paragraph' && (!loose || index === 0)) {
      for (const inline of renderInlines(child.children, options)) result.push(inline)
      if (loose) result = [h(options, 'p', { key: `${key}:paragraph` }, result)]
    } else result.push(renderBlockReact(child, options, `${key}:${index}`))
  }
  return result
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

  const result = item.children.map((child, index) => {
    if (index === lastIndex && child.type === 'paragraph') {
      return h(options, 'p', { key: index }, renderInlines(child.children, options), backrefs)
    }
    return renderBlockReact(child, options, `${index}`)
  })
  if (item.children[lastIndex]?.type !== 'paragraph') result.push(h(options, 'p', { key: 'backref-wrapper' }, backrefs.slice(1)))
  return result
}

function renderFootnoteBackrefsReact(item: FootnoteItemNode, options: MarkdownReactOptions): ReactNode[] {
  const result: ReactNode[] = []
  for (let index = 1; index <= (item.referenceCount ?? 1); index++) {
    const referenceId = footnoteReferenceId(item.id, index)
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

function h(options: MarkdownReactOptions, tag: string | typeof Fragment, props: Record<string, any> | null, ...children: ReactNode[]): ReactElement {
  const component = typeof tag === 'string' ? options.components?.[tag] ?? tag : tag
  return createElement(component, props, ...children)
}

function renderComponentReact(node: ComponentNode | InlineComponentNode, options: MarkdownReactOptions, key?: string): ReactElement {
  const tag = node.tagName ?? (node.type === 'inlineComponent' ? 'span' : 'md-comment-component')
  const props: Record<string, string> = {
    ...(node.properties ?? {}),
  }

  if (!node.tagName) {
    props['data-component'] = node.name
    if (!props['data-attributes']) props['data-attributes'] = JSON.stringify(node.attributes)
  }

  return h(options, tag, { key, ...props }, node.type === 'inlineComponent'
    ? renderInlines(node.children, options)
    : node.children.map((child, index) => renderBlockReact(child, options, `${key}:${index}`)))
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
