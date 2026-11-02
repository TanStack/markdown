import { expect, it } from 'vitest'
import { parseMarkdown } from '../src/parser.js'
import { renderHtml } from '../src/html.js'

it('preserves mutable complete line arrays on marker-free input', () => {
  const snapshots: string[][] = []
  const document = parseMarkdown('alpha\nbeta', { extensions: [{ name: 'mutate', parseBlock(context) {
    snapshots.push([...context.lines])
    context.lines[context.index] = 'changed'
    return undefined
  } }] })
  expect(snapshots[0]).toEqual(['alpha', 'beta'])
  expect(renderHtml(document)).toBe('<p>changed\nbeta</p>')
})

it('keeps frontmatter normalization and fence behavior on marker-free input', () => {
  const document = parseMarkdown('\uFEFF---\r\ntitle: test\r\n---\r\n```js\r\nconst x = 1\r\n```')
  expect(document.frontmatter).toBe('title: test')
  expect(document.children).toEqual([{ type: 'code', value: 'const x = 1', lang: 'js' }])
})

it('retains late references and footnotes for every progressive prefix', () => {
  const source = '[a] and note[^n]\n\n[a]: /target\n[^n]: footnote'
  expect(renderHtml(source)).toContain('href="/target"')
  expect(renderHtml(source)).toContain('footnote')
  for (let end = 0; end <= source.length; end++) {
    const prefix = source.slice(0, end)
    expect(renderHtml(parseMarkdown(prefix))).toBe(renderHtml(prefix))
  }
})

it('does not infer definitions from fenced marker lines', () => {
  expect(renderHtml('```\n[a]: /inside\n```\n\n[a]')).toBe('<pre class="tm-code"><code>[a]: /inside</code></pre>\n<p>[a]</p>')
})
