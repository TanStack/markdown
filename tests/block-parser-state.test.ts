import { expect, it } from 'vitest'
import { parseMarkdown } from '../src/parser.js'
import type { BlockNode, ParseOptions } from '../src/types.js'

it('keeps escaped nested-block delegates bound to the original slugger and mutable options', () => {
  let retained: ((source: string) => BlockNode[]) | undefined
  const options: ParseOptions = { extensions: [{ name: 'capture', parseBlock(context) {
    retained ??= context.parseBlocks
    return undefined
  } }] }
  expect(parseMarkdown('# Same', options).children).toEqual([{ type: 'heading', depth: 1, id: 'same', children: [{ type: 'text', value: 'Same' }] }])
  expect(retained!('# Same')).toEqual([{ type: 'heading', depth: 1, id: 'same-2', children: [{ type: 'text', value: 'Same' }] }])
  options.headingIds = false
  expect(retained!('# Same')).toEqual([{ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Same' }] }])
})

it('preserves heading option getter reads and the callback receiver', () => {
  const events: string[] = []
  const options: ParseOptions = {}
  Object.defineProperty(options, 'headingIds', { get() {
    events.push('read')
    return function(this: ParseOptions, value: string) {
      events.push(this === options ? 'same receiver' : 'wrong receiver')
      return value.toLowerCase()
    }
  } })
  parseMarkdown('# One\n\n# Two', options)
  expect(events).toEqual(['read', 'read', 'read', 'same receiver', 'read', 'read', 'read', 'same receiver'])
})
