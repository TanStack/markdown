import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/parser.js'
import { renderHtml } from '../src/html.js'

describe('definition extraction boundaries', () => {
  it.each([
    '[a]: /first\n[a]: /second\ntext [a]',
    'text [a]\n[a]: /first\n[a]: /second',
    '[a]: /first\ntext [a]\n[a]: /second',
  ])('preserves first definitions and surrounding text: %s', source => {
    expect(renderHtml(source)).toBe('<p>text <a href="/first">a</a></p>')
  })

  it('exposes complete compacted lines to hooks before parsing, including footnote continuations', () => {
    const seen: string[][] = []
    const source = '[a]: /a\nalpha [a]\n\n[^n]: note\n    continued\nomega[^n]\n[z]: /z\n[z]'
    const document = parseMarkdown(source, { extensions: [{ name: 'observe', parseBlock(context) {
      seen.push([...context.lines])
      return undefined
    } }] })
    expect(seen[0]).toEqual(['alpha [a]', '', 'omega[^n]', '[z]'])
    expect(seen).toContainEqual(['note', 'continued'])
    expect(document.children.map(node => node.type)).toEqual(['paragraph', 'paragraph', 'footnotes'])
    expect(renderHtml(document)).toContain('<a href="/z">z</a>')
  })

  it('retains fenced definition-like lines after earlier definitions are removed', () => {
    const source = '[a]: /a\n```text\n[b]: /inside\n```\n[b]\n[b]: /outside'
    expect(renderHtml(source)).toBe('<pre class="tm-code" data-lang="text"><code class="language-text">[b]: /inside</code></pre>\n<p><a href="/outside">b</a></p>')
  })

  it('keeps frontmatter and normalization separate from removed definition lines', () => {
    const document = parseMarkdown('\uFEFF---\r\ntitle: Example\r\n---\r\n[a]: /a\r\n[a]')
    expect(document.frontmatter).toBe('title: Example')
    expect(renderHtml(document)).toBe('<p><a href="/a">a</a></p>')
  })
})
