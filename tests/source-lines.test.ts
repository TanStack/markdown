import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/parser.js'
import { renderHtml } from '../src/html.js'

describe('source-backed block boundaries', () => {
  it.each([
    ['```', ''],
    ['```\n', ''],
    ['```\nalpha\n', 'alpha\n'],
    ['```\nalpha\n```\nafter', 'alpha'],
    ['[x]: /x\n```\n[x]: /literal\n```\n[x]', '[x]: /literal'],
    ['  ```\n  alpha\n beta\n  ```', 'alpha\nbeta'],
    ['\uFEFF```\r\nα<&\r\n', 'α<&\n'],
    ['---\ntitle: example\n---\n```\nbody\n```', 'body'],
  ])('preserves the exact fenced value for %s', (source, value) => {
    expect(parseMarkdown(source).children.find(node => node.type === 'code')).toMatchObject({ type: 'code', value })
  })

  it('observes mutations through the same real line array after a block callback', () => {
    let lines: string[] | undefined
    let calls = 0
    const document = parseMarkdown('```\noriginal\n```\n\ntail', { extensions: [{ name: 'mutate', parseBlock(context) {
      expect(Array.isArray(context.lines)).toBe(true)
      if (!lines) {
        lines = context.lines
        lines[1] = 'changed <&'
      } else expect(context.lines).toBe(lines)
      calls++
      return undefined
    } }] })
    expect(calls).toBe(2)
    expect(document.children[0]).toMatchObject({ type: 'code', value: 'changed <&' })
    expect(renderHtml(document)).toContain('changed &lt;&amp;')
  })

  it('keeps nested indented fenced blocks on the same observable semantics', () => {
    expect(parseMarkdown('- item\n\n  ```\n  code\n  ```').children[0]).toMatchObject({
      type: 'list', items: [{ children: [{ type: 'paragraph' }, { type: 'code', value: 'code' }] }],
    })
  })
})
