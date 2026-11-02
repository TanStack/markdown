import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/html.js'
import type { BlockNode, CalloutNode, HeadingNode, InlineNode, MarkdownDocument, RenderOptions } from '../src/types.js'

describe('owned HTML emission', () => {
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


describe('renderer metadata evaluation order', () => {
  it('reads a callout title after its child render hooks', () => {
    const callout: CalloutNode = { type: 'callout', kind: 'note', title: 'old', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'body' }] }] }
    const html = renderHtml({ type: 'root', children: [callout] }, { extensions: [{ name: 'title', renderHtml(node) {
      if (node.type === 'text') callout.title = 'changed<&'
      return undefined
    } }] })
    expect(html).toContain('markdown-alert-title">changed&lt;&amp;</p>')
  })

  it('reads footnote heading anchor options after rendering the items', () => {
    const options: RenderOptions = { headingAnchors: true, extensions: [{ name: 'anchor', renderHtml(node, context) {
      if (node.type === 'text') context.options.headingAnchors = { content: 'changed<&' }
      return undefined
    } }] }
    const html = renderHtml({ type: 'root', children: [{ type: 'footnotes', items: [{ id: 'n', number: 1, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'note' }] }] }] }] }, options)
    expect(html).toContain('>changed&lt;&amp;</a></h2>')
  })

  it('keeps heading opening metadata before children and closing metadata after them', () => {
    const heading: HeadingNode = { type: 'heading', depth: 2, id: 'old', children: [{ type: 'text', value: 'body' }] }
    const html = renderHtml({ type: 'root', children: [heading] }, { headingAnchors: true, extensions: [{ name: 'heading', renderHtml(node) {
      if (node.type === 'text') { heading.depth = 3; heading.id = 'changed' }
      return undefined
    } }] })
    expect(html).toContain('<h2 id="old">body<a href="#changed"')
    expect(html.endsWith('</h3>')).toBe(true)
  })
})
