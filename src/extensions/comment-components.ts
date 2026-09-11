import type { ComponentNode, MarkdownExtension } from '../types.js'

export interface CommentComponentOptions {
  transformComponent?: (node: ComponentNode) => ComponentNode
}

export interface ComponentComment {
  block: boolean
  name: string
  attributes: Record<string, string>
}

export function commentComponentsExtension(options: CommentComponentOptions = {}): MarkdownExtension {
  return {
    name: 'comment-components',
    parseBlock: context => parseCommentComponentBlock(context, options),
  }
}

export function parseCommentComponentBlock(
  context: Parameters<NonNullable<MarkdownExtension['parseBlock']>>[0],
  options: CommentComponentOptions = {},
): ComponentNode | undefined {
  const line = context.lines[context.index] ?? ''
  const start = parseComponentComment(line)
  if (!start) return undefined

  let body: string | undefined
  let consumed = 1
  if (start.block) {
    const end = new RegExp(`^ {0,3}<!--\\s*::end:${start.name}\\s*-->\\s*$`, 'i')
    for (let cursor = context.index + 1; cursor < context.lines.length; cursor++) {
      if (end.test(context.lines[cursor]!)) {
        body = context.lines.slice(context.index + 1, cursor).join('\n')
        consumed = cursor - context.index + 1
        break
      }
    }
  }

  context.consume(consumed)
  const node: ComponentNode = {
    type: 'component',
    name: start.name,
    attributes: start.attributes,
    children: body === undefined ? [] : context.parseBlocks(body),
  }
  return options.transformComponent?.(node) ?? node
}

export function parseComponentComment(line: string): ComponentComment | undefined {
  const match = line.match(/^ {0,3}<!--\s*::(start:)?([A-Za-z][\w-]*)(.*?)\s*-->\s*$/)
  if (!match) return undefined
  return {
    block: Boolean(match[1]),
    name: match[2]!.toLowerCase(),
    attributes: parseAttributes(match[3] ?? ''),
  }
}

export function parseAttributes(value: string): Record<string, string> {
  const attrs: Record<string, string> = Object.create(null)
  const regex = /([A-Za-z_][\w:-]*)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"']+)))?/g
  for (const match of value.matchAll(regex)) {
    attrs[match[1]!] = match[2] ?? match[3] ?? match[4] ?? 'true'
  }
  return attrs
}
