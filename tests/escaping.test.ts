import { expect, it } from 'vitest'
import { renderInline } from '../src/html.js'
import { escapeAttr, escapeHtml } from '../src/utils.js'

it('preserves entity literals and the text/attribute backtick distinction', () => {
  const value = '&amp;<tag>"\'`'
  expect(escapeHtml(value)).toBe('&amp;amp;&lt;tag&gt;&quot;&#39;`')
  expect(escapeAttr(value)).toBe('&amp;amp;&lt;tag&gt;&quot;&#39;&#96;')
})

it('preserves UTF16 boundaries while escaping public inline output', () => {
  const value = '\uD800&😀<\uDC00\u0000\r\n'
  expect(renderInline({ type: 'text', value })).toBe('\uD800&amp;😀&lt;\uDC00\u0000\r\n')
})
