import { execFileSync } from 'node:child_process'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import { docsMarkdownExtensions } from '../src/extensions/docs.js'
import { splitByHeading } from '../src/extensions/shared.js'
import { transformBundlerTabs } from '../src/extensions/tabs.js'
import { escapeAttr, escapeHtml, sanitizeUrl } from '../src/utils.js'
import type { MarkdownInput, RenderOptions } from '../src/types.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

function equivalent(input: MarkdownInput, options: RenderOptions = {}) {
  const html = renderHtml(input, options)
  expect(normalizeStaticMarkup(renderToStaticMarkup(<Markdown {...options}>{input}</Markdown>))).toBe(normalizeStaticMarkup(html))
  expect(normalizeStaticMarkup(renderOctane(OctaneMarkdown, { children: input, ...options }).html)).toBe(normalizeStaticMarkup(html))
  return html
}

describe('audit regressions', () => {
  it('keeps single-pass attribute escaping identical to the existing policy', () => {
    const source = Array.from({ length: 256 }, (_, index) => String.fromCharCode(index)).join('') + '\u2028\u2029&copy;&#96;'
    expect(escapeAttr(source)).toBe(escapeHtml(source).replace(/`/g, '&#96;'))
    expect(escapeAttr('&<>"\'`')).toBe('&amp;&lt;&gt;&quot;&#39;&#96;')
    expect(escapeHtml('`')).toBe('`')
  })

  it.each([
    ['`a  b`', 'a  b'],
    ['` a  b `', 'a  b'],
    ['`  a  `', ' a '],
    ['`   `', '   '],
    ['`a\tb`', 'a\tb'],
    ['`\u00a0a\u00a0`', '\u00a0a\u00a0'],
    ['`a\nb`', 'a b'],
    ['``a`b``', 'a`b'],
    ['`a``b`', 'a``b'],
    ['``a```b``', 'a```b'],
  ])('preserves code span content in %j', (source, value) => {
    expect(parseInline(source)).toEqual([{ type: 'inlineCode', value }])
    equivalent(source)
  })

  it.each(['`a``', '``a```', '```a``'])('does not close %j with a different length backtick run', source => {
    expect(parseInline(source)).toEqual([{ type: 'text', value: source }])
  })

  it('keeps formatted image descriptions as accessible alt text', () => {
    expect(equivalent('![**Strong** and *emphasis* with `code`](/image.png)')).toContain('alt="Strong and emphasis with code"')
    expect(equivalent('![A [reference][ref]](/image.png)\n\n[ref]: /target')).toContain('alt="A reference"')
    expect(equivalent('![A[^note]](/image.png)\n\n[^note]: Hidden')).not.toContain('data-footnotes')
  })

  it('supports every escaped ASCII punctuation character without stripping other backslashes', () => {
    const punctuation = Array.from({ length: 94 }, (_, i) => String.fromCharCode(i + 33)).filter(c => /[^a-z0-9]/i.test(c))
    for (const char of punctuation) expect(parseInline(`\\${char}`)).toEqual([{ type: 'text', value: char }])
    expect(parseInline('\\a \\1')).toEqual([{ type: 'text', value: '\\a \\1' }])
  })

  it('handles nested triple emphasis and even backslashes before closing delimiters', () => {
    expect(equivalent('*a ***b*** c*')).toBe('<p><em>a <em><strong>b</strong></em> c</em></p>')
    expect(equivalent(String.raw`*a\\*`)).toBe('<p><em>a\\</em></p>')
    expect(equivalent(String.raw`[a\\](/x)`)).toBe('<p><a href="/x">a\\</a></p>')
  })

  it('keeps code after a fence-like line out of reference extraction', () => {
    const source = '```md\n```not a closing fence\n[ref]: /inside\n[^note]: inside\n```\n\n[ref] [^note]'
    expect(parseMarkdown(source).children).toEqual([
      { type: 'code', lang: 'md', value: '```not a closing fence\n[ref]: /inside\n[^note]: inside' },
      { type: 'paragraph', children: [{ type: 'text', value: '[ref] [^note]' }] },
    ])
    equivalent(source)
  })

  it('normalizes reference whitespace and keeps the first definition', () => {
    expect(equivalent('[Example label]\n\n[Example  label]: /first\n[example\tlabel]: /second')).toBe('<p><a href="/first">Example label</a></p>')
  })

  it('keeps escaped trailing pipes in table cells', () => {
    expect(equivalent('Header | Last\\|\n--- | ---\nBody | Final\\|')).toBe('<table><thead><tr><th>Header</th><th>Last|</th></tr></thead><tbody><tr><td>Body</td><td>Final|</td></tr></tbody></table>')
  })

  it('reserves generated IDs as well as their base names', () => {
    const source = '# Foo\n# Foo\n# Foo-2\n# Foo\n# Foo-3\n\nnote[^a b] note[^a-b] note[^a-b-2]\n\n[^a b]: # Foo\n[^a-b]: # Foo\n[^a-b-2]: # Foo'
    const ids = [...equivalent(source).matchAll(/\bid="([^"]+)"/g)].map(match => match[1])
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.slice(0, 5)).toEqual(['foo', 'foo-2', 'foo-2-2', 'foo-3', 'foo-3-2'])
  })

  it('preserves the URL policy for mixed case, controls, and relative paths', () => {
    for (const protocol of ['http:', 'https:', 'mailto:', 'tel:', 'HTTP:', 'hTtPs:']) {
      for (const separator of ['', '\n', '\t', '\0', '\x7f', '\u00a0', '\ufeff']) {
        expect(sanitizeUrl(protocol.split('').join(separator) + 'example')).toBe(protocol + 'example')
      }
    }
    for (const protocol of ['javascript:', 'vbscript:', 'data:', 'file:', 'ftp:', 'custom+name:', 'hTtPsX:']) {
      for (const separator of ['', '\n', '\t', '\0', '\x7f', '\u00a0', '\ufeff']) {
        expect(sanitizeUrl(protocol.split('').join(separator) + 'example')).toBe('')
      }
    }
    for (const value of ['', '#here', '/path:foo', '//host/path', './a:b', '../a:b', 'docs/a:b', '?q=a:b']) {
      expect(sanitizeUrl(` ${value}\n`)).toBe(value)
    }
  })

  it('preserves escapes after exhausting the delimiter scan budget', () => {
    const prefix = '['.repeat(32000)
    expect(parseInline(prefix + '\\*tail\\\nnext')).toEqual([
      { type: 'text', value: prefix + '*tail' },
      { type: 'break' },
      { type: 'text', value: 'next' },
    ])
    expect(parseInline('before [plain](javascript:bad) after')).toEqual([{ type: 'text', value: 'before plain after' }])
    expect(equivalent('before [*label*](javascript:bad) after')).toBe('<p>before <em>label</em> after</p>')
  })

  it('preserves ordered list starts of zero in all renderers', () => {
    expect(equivalent('0. Zero\n1. One')).toBe('<ol start="0">\n<li>Zero</li>\n<li>One</li>\n</ol>')
  })

  it('unwraps every direct paragraph in a tight list AST', () => {
    expect(equivalent({ type: 'root', children: [{ type: 'list', ordered: false, items: [{ type: 'listItem', children: [
      { type: 'paragraph', children: [{ type: 'text', value: 'First' }] },
      { type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Quote' }] }] },
      { type: 'paragraph', children: [{ type: 'text', value: 'Last' }] },
    ] }] }] })).not.toContain('<p>Last</p>')
  })

  it('rejects unsafe integer line ranges without hanging', () => {
    // A subprocess timeout catches an infinite synchronous loop, unlike a test timeout.
    const source = '```js {10000000000000000-10000000000001000,2,9007199254740991}\nx\n```'
    const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
      `import {parseMarkdown} from './src/parser.ts'; console.log(JSON.stringify(parseMarkdown(${JSON.stringify(source)})))`,
    ], { encoding: 'utf8', timeout: 3000 })
    expect(JSON.parse(output).children[0].highlightLines).toEqual([2, Number.MAX_SAFE_INTEGER])
  })

  it('keeps large code spans with one-sided padding and all-space content bounded', () => {
    const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
      `import {parseInline} from './src/inline.ts';
      for (const content of [' ' + 'a'.repeat(100000), 'a'.repeat(100000) + ' ', ' '.repeat(100000)]) {
        const nodes = parseInline(String.fromCharCode(96) + content + String.fromCharCode(96));
        if (nodes.length !== 1 || nodes[0].type !== 'inlineCode' || nodes[0].value !== content) throw Error('Changed code span');
      }
      console.log('ok');`,
    ], { encoding: 'utf8', timeout: 3000 })
    expect(output.trim()).toBe('ok')
  })

  it('handles prototype names in package-manager tabs without throwing', () => {
    const document = parseMarkdown('<!-- ::start:tabs variant="package-manager" -->\n\n`__proto__`: example\nconstructor: another\n\n<!-- ::end:tabs -->', { extensions: docsMarkdownExtensions() })
    expect(document.children[0]).toMatchObject({ properties: {
      'data-package-manager-meta': '{"packagesByFramework":{"__proto__":[["example"]],"constructor":[["another"]]},"mode":"install"}',
    } })
    equivalent(document)
  })

  it('splits large heading collections without exceeding the argument limit', () => {
    const headings = Array.from({ length: 150000 }, () => ({ type: 'heading' as const, depth: 2 as const, children: [] }))
    expect(splitByHeading(headings)).toHaveLength(headings.length)
  })

  it('keeps bundler tab ordering, first matches, and unknown-section filtering', () => {
    const node = { type: 'component' as const, name: 'tabs', attributes: { variant: 'bundler' }, children: parseMarkdown('# Rsbuild\nFirst\n# Other\nIgnored\n# VITE\nSecond\n# vite\nDuplicate').children }
    const result = transformBundlerTabs(node)
    expect(result.properties?.['data-bundler-meta']).toBe('{"bundlers":["vite","rsbuild"]}')
    expect(equivalent({ type: 'root', children: [result] })).not.toMatch(/Ignored|Duplicate/)
    const unknown = { ...node, children: parseMarkdown('# Other\nIgnored').children }
    expect(transformBundlerTabs(unknown)).toBe(unknown)
  })
})
