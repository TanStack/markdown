import { createElement } from 'react'
import { renderToStaticMarkup as renderReact } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it, vi } from 'vitest'
import { parseInline, parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown as ReactMarkdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import type { InlineParser, MarkdownDocument, MarkdownExtension, ParseOptions } from '../src/types.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

const literal: MarkdownExtension = {
  name: 'literal-brackets',
  inlineParser: {
    markers: '[',
    parse({ source, index }) {
      if (!source.startsWith('[[', index)) return
      const end = source.indexOf(']]', index + 2)
      if (end === -1) return
      return {
        length: end + 2 - index,
        node: { type: 'inlineComponent', name: 'literal', tagName: 'mark', attributes: {},
          children: [{ type: 'text', value: source.slice(index + 2, end) }] },
      }
    },
  },
}
const options: ParseOptions = { extensions: [literal] }

function renderAll(source: string | MarkdownDocument, options: ParseOptions = {}) {
  const html = renderHtml(source, options)
  expect(normalizeStaticMarkup(renderReact(createElement(ReactMarkdown, { children: source, ...options })))).toBe(normalizeStaticMarkup(html))
  expect(normalizeStaticMarkup(renderOctane(OctaneMarkdown, { children: source, ...options }).html)).toBe(normalizeStaticMarkup(html))
  return html
}

describe('source-level inline parsers', () => {
  it('claims source before emphasis or links can change it', () => {
    expect(renderAll('before [[**bold** [link](/url) <script>]] after', options))
      .toBe('<p>before <mark>**bold** [link](/url) &lt;script&gt;</mark> after</p>')
    expect(renderAll('[[unclosed', options)).toBe('<p>[[unclosed</p>')
  })

  it('preserves escaped openers, code, image alt text, and destinations', () => {
    expect(renderAll('\\[[literal]] `[[code]]` ![[[alt]]](/image) [text](/[[path]])', options))
      .toBe('<p>[[literal]] <code>[[code]]</code> <img src="/image" alt="[[alt]]"> <a href="/[[path]]">text</a></p>')
    expect(renderAll('```\n[[fenced]]\n```', options)).not.toContain('<mark>')
    expect(renderAll('\\\\[[active]]', options)).toBe('<p>\\<mark>active</mark></p>')
  })

  it('works inside inline and block containers and after AST serialization', () => {
    const source = '# [[heading]]\n\n**[[bold]]** and [a [[label]]](/url)\n\n> [[quote]]\n\n- [[list]]\n\n| [[head]] |\n| --- |\n| [[cell]] |'
    const document = parseMarkdown(source, options)
    const html = renderAll(source, options)
    expect(html.match(/<mark>/g)).toHaveLength(7)
    expect(renderAll(JSON.parse(JSON.stringify(document)))).toBe(html)
  })

  it('runs ordered parsers only at declared markers, then inline transforms', () => {
    const first = vi.fn<InlineParser['parse']>(() => undefined)
    const second = vi.fn<InlineParser['parse']>(() => ({ length: 1, node: { type: 'text', value: 'claimed' } }))
    const third = vi.fn<InlineParser['parse']>(() => undefined)
    const transform = vi.fn((nodes) => nodes)
    const extensions: MarkdownExtension[] = [
      { name: 'first', inlineParser: { markers: '@', parse: first } },
      { name: 'second', inlineParser: { markers: '@', parse: second }, transformInline: transform },
      { name: 'third', inlineParser: { markers: '@', parse: third } },
    ]
    expect(renderHtml('ordinary **text** @ tail', { extensions })).toBe('<p>ordinary <strong>text</strong> claimed tail</p>')
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
    expect(third).not.toHaveBeenCalled()
    expect(transform).toHaveBeenCalledTimes(1)
    expect(second.mock.calls[0]![0]).toMatchObject({ source: 'ordinary **text** @ tail', index: 18 })
  })

  it.each(['[', ']', '-', '^', '§'])('treats marker characters literally: %s', marker => {
    const extensions: MarkdownExtension[] = [{ name: 'single', inlineParser: {
      markers: marker,
      parse: () => ({ length: 1, node: { type: 'inlineCode', value: 'found' } }),
    } }]
    expect(renderHtml(`text ${marker} end`, { extensions })).toBe('<p>text <code>found</code> end</p>')
  })

  it.each([0, -1, 0.5, NaN, Infinity, 100])('rejects invalid consumed lengths: %s', length => {
    expect(() => parseInline('@', { extensions: [{ name: 'invalid', inlineParser: {
      markers: '@', parse: () => ({ length, node: { type: 'text', value: '' } }),
    } }] })).toThrow(RangeError)
  })

  it('shares recursion limits through the child parser helper', () => {
    const parse = vi.fn<InlineParser['parse']>(({ source, parseInline }) => ({
      length: source.length,
      node: { type: 'strong', children: parseInline(source) },
    }))
    const html = renderHtml('@', { extensions: [{ name: 'recursive', inlineParser: { markers: '@', parse } }] })
    expect(parse).toHaveBeenCalledTimes(32)
    expect(html).toContain('@')
  })

  it('shares scan limits across many unsuccessful hooks', () => {
    const parse = vi.fn<InlineParser['parse']>(() => undefined)
    const extensions = Array.from({ length: 40 }, (_, index) => ({ name: String(index), inlineParser: { markers: '@', parse } }))
    expect(renderHtml('@'.repeat(100), { extensions })).toBe(`<p>${'@'.repeat(100)}</p>`)
    expect(parse.mock.calls.length).toBeLessThanOrEqual(1600)
  })

  it('exposes link context through emphasis and recursive child parsing', () => {
    const inLinks: boolean[] = []
    const extensions: MarkdownExtension[] = [{ name: 'context', inlineParser: {
      markers: '@',
      parse({ source, index, inLink, parseInline }) {
        inLinks.push(inLink)
        return { length: source.length - index, node: { type: 'strong', children: parseInline(source.slice(index + 1)) } }
      },
    } }]
    expect(renderHtml('@@outside [**@@inside**](/url)', { extensions })).toContain('inside')
    expect(inLinks).toEqual([false, false, true, true])
  })

  it('counts extension links when preventing nested Markdown links', () => {
    const extensions: MarkdownExtension[] = [{ name: 'link', inlineParser: {
      markers: '@', parse: () => ({ length: 1, node: { type: 'link', href: '/inner', children: [{ type: 'text', value: 'inner' }] } }),
    } }]
    expect(renderAll('[@](/outer)', { extensions })).toBe('<p>[<a href="/inner">inner</a>](/outer)</p>')
  })
})
