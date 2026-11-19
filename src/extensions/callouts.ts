import type { CalloutNode, MarkdownExtension } from '../types.js'

export function calloutsExtension(): MarkdownExtension {
  return {
    name: 'callouts',
    parseBlock: parseCalloutBlock,
  }
}

export function parseCalloutBlock({
  lines,
  index,
  consume,
  parseBlocks,
}: Parameters<NonNullable<MarkdownExtension['parseBlock']>>[0]): CalloutNode | undefined {
  const match = lines[index]?.match(/^ {0,3}>\s*\[!([A-Za-z]+)\]([+-])?(?:\s+(.*))?$/)
  if (!match) return

  const kind = match[1]!.toLowerCase()
  const body: string[] = []
  let cursor = index + 1
  for (let quote; (quote = lines[cursor]?.match(/^ {0,3}>\s?(.*)$/)); cursor++) {
    body.push(quote[1]!)
  }

  consume(cursor - index)
  return {
    type: 'callout',
    kind,
    title: match[3]?.trim() || kind[0]!.toUpperCase() + kind.slice(1),
    ...(match[2] && { open: match[2] === '+' }),
    children: parseBlocks(body.join('\n')),
  }
}
