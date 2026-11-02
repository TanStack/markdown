import { renderToStaticMarkup } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'

it.each([
  ['- item', false, undefined],
  ['1. item', true, 1],
  ['0. item', true, 0],
  ['000000001. item', true, 1],
  ['999999999. item', true, 999999999],
] as const)('preserves public list starts for %s', (source, ordered, start) => {
  const document = JSON.parse(JSON.stringify(parseMarkdown(source)))
  expect(document.children[0]).toMatchObject({ type: 'list', ordered })
  if (ordered) expect(document.children[0].start).toBe(start)
  else expect(document.children[0]).not.toHaveProperty('start')
  expect(renderHtml(document)).toBe(renderHtml(source))
  expect(renderToStaticMarkup(<Markdown>{document}</Markdown>)).toBe(renderToStaticMarkup(<Markdown>{source}</Markdown>))
  expect(renderOctane(OctaneMarkdown, { children: document }).html).toBe(renderOctane(OctaneMarkdown, { children: source }).html)
})
