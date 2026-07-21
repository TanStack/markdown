import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

describe('SSR and React output equivalence', () => {
  const fixtures = [
    '# Title\n\nParagraph with **strong**, _em_, ~~strike~~, and `code`.',
    '```ts title="demo.ts" {1}\nconst value = 1\n```',
    '| A | B |\n| :--- | ---: |\n| one | two |',
    '- [x] done\n- [ ] todo',
    '- parent\n  - nested one\n  - nested two\n- sibling',
    '> ## Quote\n>\n> body',
    'One[^note], again[^note].\n\n[^note]: Footnote.',
  ]

  it.each(fixtures)('matches static React output for %j', source => {
    const html = normalizeStaticMarkup(renderHtml(source))
    const react = normalizeStaticMarkup(renderToStaticMarkup(<Markdown>{source}</Markdown>))

    expect(react).toBe(html)
  })
})
