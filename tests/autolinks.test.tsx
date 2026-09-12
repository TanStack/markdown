import { createElement } from 'react'
import { renderToStaticMarkup as renderReact } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it, vi } from 'vitest'
import { autolinksExtension } from '../src/extensions/autolinks.js'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown as ReactMarkdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import type { MarkdownDocument, ParseOptions } from '../src/types.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

const extensions = [autolinksExtension()]
const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const link = (url: string) => `<a href="${escape(url)}">${escape(url)}</a>`
function renderAll(source: string | MarkdownDocument, options: ParseOptions = {}) {
  options = { extensions, ...options }
  const html = renderHtml(source, options)
  expect(normalizeStaticMarkup(renderReact(createElement(ReactMarkdown, { children: source, ...options })))).toBe(normalizeStaticMarkup(html))
  expect(normalizeStaticMarkup(renderOctane(OctaneMarkdown, { children: source, ...options }).html)).toBe(normalizeStaticMarkup(html))
  return html
}

describe('optional HTTP(S) autolinks', () => {
  it('does not change core behavior unless enabled', () => {
    expect(renderHtml('https://example.com')).toBe('<p>https://example.com</p>')
    expect(renderAll('See https://example.com.')).toBe(`<p>See ${link('https://example.com')}.</p>`)
  })

  it.each([
    'http://example.com', 'HTTPS://EXAMPLE.COM/path', 'https://example.com/~alice~/notes',
    'https://example.com/?q=*hello*', 'https://example.com/a_b_c',
    'https://example.com/?a=1&b=2#part', 'http://localhost:3000/docs', 'http://[::1]:3000/docs',
    'https://例え.jp/道', 'https://example.com/a%20b',
  ])('preserves the source URL: %s', url => {
    expect(renderAll(`See ${url}`)).toBe(`<p>See ${link(url)}</p>`)
  })

  it.each(['.', ',', '!', '?', ';', ':', '...?!'])('leaves sentence punctuation outside the link: %s', punctuation => {
    expect(renderAll(`https://example.com/path${punctuation}`)).toBe(`<p>${link('https://example.com/path')}${punctuation}</p>`)
  })

  it.each([
    ['(https://example.com/a_(b)).', `(${link('https://example.com/a_(b)')}).`],
    ['[https://example.com/a[b]]', `[${link('https://example.com/a[b]')}]`],
    ['https://example.com/a{b}}', `${link('https://example.com/a{b}')}}`],
    ['https://example.com/a_(b(c))', link('https://example.com/a_(b(c))')],
  ])('balances URL delimiters: %s', (source, html) => {
    expect(renderAll(source)).toBe(`<p>${html}</p>`)
  })

  it.each(['https://example.com/path.', 'https://example.com/a)', 'http://[::1]:8080', 'https://example.com/?q=*hello*'])('honors explicit angle boundaries: %s', url => {
    expect(renderAll(`<${url}>`)).toBe(`<p>${link(url)}</p>`)
  })

  it('works in ordinary formatting, headings, lists, quotes, and table cells', () => {
    const url = 'https://example.com/~alice~/notes'
    const source = `# ${url}\n\n**${url}** *${url}*\n\n> ${url}\n\n- ${url}\n\n| Site |\n| --- |\n| ${url} |`
    const html = renderAll(source)
    expect(html.match(/<a /g)).toHaveLength(6)
    expect(html).not.toContain('<del>')
    expect(html).toContain(`<strong>${link(url)}</strong>`)
    const document = parseMarkdown(source, { extensions })
    expect(renderAll(JSON.parse(JSON.stringify(document)))).toBe(html)
  })

  it('leaves explicit links, reference links, images, and code alone', () => {
    const url = 'https://example.com'
    const source = `[${url}](/target) [**${url}**](/target) ![${url}](/image) \`${url}\`\n\n[${url}][id]\n\n[id]: /target\n\n\`\`\`\n${url}\n\`\`\``
    expect(renderAll(source)).toBe(renderHtml(source))
  })

  it('leaves raw HTML tag attributes alone when HTML is enabled', () => {
    const source = '<span title="https://example.com">text</span>'
    expect(parseMarkdown(source, { extensions, allowHtml: true })).toEqual(parseMarkdown(source, { allowHtml: true }))
  })

  it.each([
    'www.example.com', 'person@example.com', 'ftp://example.com', 'javascript:alert(1)',
    'xhttps://example.com', 'éhttps://example.com', '/https://example.com',
    'https://', 'https://%', 'https://example.com:invalid/path', '<https://example.com',
    '\\<https://example.com>',
  ])('keeps unsupported or malformed input literal: %s', source => {
    expect(renderAll(source)).toBe(renderHtml(source))
  })

  it('passes complete URLs to application policy before inline transforms', () => {
    const url = 'https://example.com/~alice~/notes'
    const urlTransform = vi.fn((raw: string, kind: string, fallback: string) => {
      expect([raw, kind, fallback]).toEqual([url, 'link', url])
      return '/redirect'
    })
    expect(renderAll(url, { urlTransform })).toBe(`<p><a href="/redirect">${url}</a></p>`)
    expect(urlTransform).toHaveBeenCalledTimes(3)
    expect(renderAll(`<${url}>`, { urlTransform: () => null })).toBe(`<p>${url}</p>`)
  })

  it('supports a mixture of rejected and accepted links', () => {
    expect(renderAll('https://blocked.test https://allowed.test', {
      urlTransform: (url, _kind, safe) => url.includes('blocked') ? null : safe,
    })).toBe(`<p>https://blocked.test ${link('https://allowed.test')}</p>`)
  })

  it('escapes labels and attributes and excludes controls and quotes', () => {
    expect(renderAll('https://example.com/?x=<script>')).toBe(`<p>${link('https://example.com/?x=')}&lt;script&gt;</p>`)
    expect(renderAll('https://example.com/" onclick="bad')).toBe(`<p>${link('https://example.com/')}&quot; onclick=&quot;bad</p>`)
    expect(renderAll('https://example.com/a\u0001b')).toBe(`<p>${link('https://example.com/a')}\u0001b</p>`)
  })

  it('does not repeatedly scan the suffix of a malformed URL', () => {
    const source = 'https://%' + 'https://%'.repeat(10000)
    expect(renderHtml(source, { extensions })).toBe(`<p>${source}</p>`)
  })
})
