import { createElement } from 'react'
import { renderToStaticMarkup as renderReact } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it, vi } from 'vitest'
import { parseInline, parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown as ReactMarkdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import type { MarkdownDocument, ParseOptions, UrlTransform } from '../src/types.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

const pixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
const allowPixel: UrlTransform = (url, kind, defaultUrl) => kind === 'image' && url === pixel ? url : defaultUrl

function renderAll(source: string | MarkdownDocument, options: ParseOptions = {}) {
  const html = renderHtml(source, options)
  expect(normalizeStaticMarkup(renderReact(createElement(ReactMarkdown, { children: source, ...options })))).toBe(normalizeStaticMarkup(html))
  expect(normalizeStaticMarkup(renderOctane(OctaneMarkdown, { children: source, ...options }).html)).toBe(normalizeStaticMarkup(html))
  return html
}

describe('application URL policy (#11)', () => {
  it('allows an explicitly approved image without enabling raw HTML or data links', () => {
    expect(renderAll(`![Pixel](${pixel}) [link](${pixel}) <script>`, { urlTransform: allowPixel })).toBe(`<p><img src="${pixel}" alt="Pixel"> link &lt;script&gt;</p>`)
    expect(renderHtml(`![Pixel](${pixel})`)).toBe('<p><img src="" alt="Pixel"></p>')
  })

  it('sees reference destinations before unsafe URLs are removed and before inline transforms', () => {
    const urlTransform = vi.fn(allowPixel)
    const options: ParseOptions = { urlTransform, extensions: [{ name: 'inspect', transformInline(nodes) {
      expect(nodes).toContainEqual({ type: 'image', src: pixel, alt: 'Pixel' })
      return nodes
    } }] }
    const source = `![Pixel][image]\n\n[image]: ${pixel}`
    const document = parseMarkdown(source, options)
    expect(urlTransform.mock.calls).toEqual([[pixel, 'image', '']])
    expect(renderAll(JSON.parse(JSON.stringify(document)))).toBe(`<p><img src="${pixel}" alt="Pixel"></p>`)
    expect(parseInline('![Pixel][image]', { references: { image: { href: pixel } }, urlTransform: allowPixel }))
      .toEqual([{ type: 'image', src: pixel, alt: 'Pixel' }])
  })

  it.each([
    '[text](https://example.com)', '[text](/relative)', '[text](#fragment)', '[text](mailto:hi@example.com)',
    '[text](tel:123)', '[text](javascript:alert%281%29)', '[text](JaVaScRiPt:bad)', '[text](java\tscript:bad)',
    '![image](vbscript:bad)', '![image](file:bad)', `![image](${pixel})`, '[empty]()', '![empty]()',
    '[image ![alt](/image)](/link)', '[outer [inner](/inner)](/outer)',
  ])('can retain exactly the default policy for %s', source => {
    const defaultPolicy: UrlTransform = (_url, _kind, defaultUrl) => defaultUrl
    // Empty image sources differ between React and HTML serialization, as before.
    expect(renderHtml(source, { urlTransform: defaultPolicy })).toBe(renderHtml(source))
    expect(parseMarkdown(source, { urlTransform: defaultPolicy })).toEqual(parseMarkdown(source))
  })

  it.each(['[label](/link)', '[label]()', '![label](/image)', '![label]()'])('uses null to reject %s, including empty destinations', source => {
    expect(renderAll(source, { urlTransform: () => null })).toBe('<p>label</p>')
  })

  it('rewrites URLs before rendering and escapes attribute values in each renderer', () => {
    const urlTransform: UrlTransform = () => '/proxy?x="&y=<script>'
    expect(renderAll('[label](/old) ![alt](/old)', { urlTransform })).toBe('<p><a href="/proxy?x=&quot;&amp;y=&lt;script&gt;">label</a> <img src="/proxy?x=&quot;&amp;y=&lt;script&gt;" alt="alt"></p>')
  })

  it('propagates the policy into lists, blockquotes, tables, emphasis, and footnotes', () => {
    const urlTransform = vi.fn((_url: string, kind: 'link' | 'image', defaultUrl: string) => `/proxy/${kind}${defaultUrl}`)
    const source = '- [one](/one)\n\n> ![two](/two)\n\n| Header |\n| --- |\n| [three](/three) |\n\n**[four](/four)**\n\nNote[^n]\n\n[^n]: [five](/five)'
    const document = parseMarkdown(source, { urlTransform })
    expect(urlTransform.mock.calls).toEqual([
      ['/one', 'link', '/one'], ['/two', 'image', '/two'], ['/three', 'link', '/three'],
      ['/four', 'link', '/four'], ['/five', 'link', '/five'],
    ])
    expect(renderAll(source, { urlTransform })).toBe(renderAll(document))
  })

  it('does not run for links used only as image alt text, code, raw HTML, or supplied ASTs', () => {
    const urlTransform = vi.fn(allowPixel)
    const source = '![alt [label](/hidden)](/image) `[code](/code)` <a href="/html">html</a>'
    const document = parseMarkdown(source, { allowHtml: true, urlTransform })
    expect(urlTransform.mock.calls).toEqual([['/image', 'image', '/image']])
    renderHtml(document, { urlTransform })
    expect(urlTransform).toHaveBeenCalledTimes(1)
  })

  it('does not hide policy exceptions or fall back to an unapproved URL', () => {
    const urlTransform: UrlTransform = () => { throw new Error('policy failed') }
    expect(() => parseMarkdown('[label](/link)', { urlTransform })).toThrow('policy failed')
  })
})
