import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/html.js'
import type { BlockNode, InlineNode, MarkdownDocument } from '../src/types.js'

describe('ordered HTML traversal', () => {
  it('ignores appended blocks and keeps separators for blocks deleted by a hook', () => {
    const nodes: BlockNode[] = [{ type: 'paragraph', children: [{ type: 'text', value: 'first' }] }, { type: 'thematicBreak' }, { type: 'thematicBreak' }]
    const visits: string[] = []
    const html = renderHtml({ type: 'root', children: nodes }, { extensions: [{ name: 'mutate', renderHtml(node) {
      visits.push(node.type)
      if (node.type === 'paragraph') {
        delete nodes[1]
        nodes.push({ type: 'thematicBreak' })
      }
      return undefined
    } }] })
    expect(html).toBe('<p>first</p>\n\n<hr>')
    expect(visits).toEqual(['paragraph', 'text', 'thematicBreak'])
  })

  it('reads replacement inline nodes but ignores newly appended nodes', () => {
    const children: InlineNode[] = [{ type: 'text', value: 'first' }, { type: 'text', value: 'old' }]
    const html = renderHtml({ type: 'root', children: [{ type: 'paragraph', children }] }, { extensions: [{ name: 'replace', renderHtml(node) {
      if (node === children[0]) {
        children[1] = { type: 'text', value: '<new>' }
        children.push({ type: 'text', value: 'ignored' })
      }
      return undefined
    } }] })
    expect(html).toBe('<p>first&lt;new&gt;</p>')
  })

  it('preserves sparse slots after a callback shortens the input', () => {
    const document: MarkdownDocument = { type: 'root', children: [{ type: 'thematicBreak' }, { type: 'thematicBreak' }, { type: 'thematicBreak' }] }
    expect(renderHtml(document, { extensions: [{ name: 'shorten', renderHtml() { document.children.length = 0; return '<x>' } }] })).toBe('<x>\n\n')
  })

  it('keeps renderer helper delegation reentrant with independent output state', () => {
    expect(renderHtml({ type: 'root', children: [{ type: 'paragraph', children: [{ type: 'strong', children: [{ type: 'text', value: 'safe<&' }] }] }] }, { extensions: [{ name: 'nested', renderHtml(node, context) {
      if (node.type === 'strong') return '[' + context.renderInline(node.children[0]!) + ']'
      return undefined
    } }] })).toBe('<p>[safe&lt;&amp;]</p>')
  })
})
