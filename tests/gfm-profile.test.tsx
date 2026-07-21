import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

// Profile-relevant examples from https://github.github.io/gfm/.
const examples = [
  {
    name: 'GFM 198: basic table',
    source: '| foo | bar |\n| --- | --- |\n| baz | bim |',
    html: '<table><thead><tr><th>foo</th><th>bar</th></tr></thead><tbody><tr><td>baz</td><td>bim</td></tr></tbody></table>',
  },
  {
    name: 'GFM 199: compact aligned table',
    source: '| abc | defghi |\n:-: | -----------:\nbar | baz',
    html: '<table><thead><tr><th style="text-align:center">abc</th><th style="text-align:right">defghi</th></tr></thead><tbody><tr><td style="text-align:center">bar</td><td style="text-align:right">baz</td></tr></tbody></table>',
  },
  {
    name: 'GFM 200: escaped pipes in table cells',
    source: '| f\\|oo  |\n| ------ |\n| b `\\|` az |\n| b **\\|** im |',
    html: '<table><thead><tr><th>f|oo</th></tr></thead><tbody><tr><td>b <code>|</code> az</td></tr><tr><td>b <strong>|</strong> im</td></tr></tbody></table>',
  },
  {
    name: 'GFM 201: block ends a table',
    source: '| abc | def |\n| --- | --- |\n| bar | baz |\n> bar',
    html: '<table><thead><tr><th>abc</th><th>def</th></tr></thead><tbody><tr><td>bar</td><td>baz</td></tr></tbody></table>\n<blockquote>\n<p>bar</p>\n</blockquote>',
  },
  {
    name: 'GFM 202: body rows may omit pipes',
    source: '| abc | def |\n| --- | --- |\n| bar | baz |\nbar\n\nbar',
    html: '<table><thead><tr><th>abc</th><th>def</th></tr></thead><tbody><tr><td>bar</td><td>baz</td></tr><tr><td>bar</td><td></td></tr></tbody></table>\n<p>bar</p>',
  },
  {
    name: 'GFM 203: header and delimiter widths must match',
    source: '| abc | def |\n| --- |\n| bar |',
    html: '<p>| abc | def |\n| --- |\n| bar |</p>',
  },
  {
    name: 'GFM 204: body rows are padded and truncated',
    source: '| abc | def |\n| --- | --- |\n| bar |\n| bar | baz | boo |',
    html: '<table><thead><tr><th>abc</th><th>def</th></tr></thead><tbody><tr><td>bar</td><td></td></tr><tr><td>bar</td><td>baz</td></tr></tbody></table>',
  },
  {
    name: 'GFM 205: header-only table',
    source: '| abc | def |\n| --- | --- |',
    html: '<table><thead><tr><th>abc</th><th>def</th></tr></thead></table>',
  },
  {
    name: 'GFM 279: task list items',
    source: '- [ ] foo\n- [x] bar',
    html: '<ul>\n<li><input type="checkbox" disabled> foo</li>\n<li><input type="checkbox" disabled checked> bar</li>\n</ul>',
  },
  {
    name: 'GFM 280: nested task list items',
    source: '- [x] foo\n  - [ ] bar\n  - [x] baz\n- [ ] bim',
    html: '<ul>\n<li><input type="checkbox" disabled checked> foo\n<ul>\n<li><input type="checkbox" disabled> bar</li>\n<li><input type="checkbox" disabled checked> baz</li>\n</ul></li>\n<li><input type="checkbox" disabled> bim</li>\n</ul>',
  },
  {
    name: 'GFM 491: one and two tilde strike',
    source: '~~Hi~~ Hello, ~there~ world!',
    html: '<p><del>Hi</del> Hello, <del>there</del> world!</p>',
  },
  {
    name: 'GFM 492: strike does not cross paragraphs',
    source: 'This ~~has a\n\nnew paragraph~~.',
    html: '<p>This ~~has a</p>\n<p>new paragraph~~.</p>',
  },
  {
    name: 'GFM 493: three tildes remain literal',
    source: 'This will ~~~not~~~ strike.',
    html: '<p>This will ~~~not~~~ strike.</p>',
  },
]

describe('GFM docs-profile examples', () => {
  it.each(examples)('$name', ({ source, html }) => {
    const react = renderToStaticMarkup(<Markdown>{source}</Markdown>)
    expect(renderHtml(source)).toBe(html)
    expect(normalizeStaticMarkup(react)).toBe(normalizeStaticMarkup(html))
  })
})
