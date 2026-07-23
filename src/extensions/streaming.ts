import type { BlockNode, ListItemNode, MarkdownExtension } from '../types.js'

export function streamingMarkdownExtension(): MarkdownExtension {
  return {
    name: 'streaming',
    transformDocument(document) {
      const children = trimTrailingPlaceholder(document.children)
      return children === document.children ? document : { ...document, children }
    },
  }
}

function trimTrailingPlaceholder(children: BlockNode[]): BlockNode[] {
  const last = children.at(-1)
  if (!last) return children

  const trimmed = trimBlock(last)
  if (trimmed === last) return children
  if (!trimmed) return children.slice(0, -1)
  return [...children.slice(0, -1), trimmed]
}

function trimBlock(node: BlockNode): BlockNode | undefined {
  if (node.type === 'heading' && node.children.length === 0) return undefined

  if (node.type === 'blockquote') {
    const children = trimTrailingPlaceholder(node.children)
    if (children.length === 0) return undefined
    return children === node.children ? node : { ...node, children }
  }

  if (node.type !== 'list') return node

  const last = node.items.at(-1)
  if (!last) return undefined

  const item = trimListItem(last)
  if (item === last) return node

  const items = item ? [...node.items.slice(0, -1), item] : node.items.slice(0, -1)
  return items.length === 0 ? undefined : { ...node, items }
}

function trimListItem(item: ListItemNode): ListItemNode | undefined {
  const children = trimTrailingPlaceholder(item.children)
  if (children.length === 0) return undefined
  return children === item.children ? item : { ...item, children }
}
