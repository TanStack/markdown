import { Fragment, createElement } from 'octane'
import type { ComponentBody } from 'octane'
import { renderToStaticMarkup } from 'octane/server'
import { describe, expect, it } from 'vitest'
import { docsMarkdownExtensions } from '../src/extensions/docs.js'
import { renderHtml } from '../src/html.js'
import { Markdown, renderMarkdownOctane } from '../src/octane.js'
import type { MarkdownOctaneOptions } from '../src/octane.js'
import { externalHighlighter } from './helpers/external-highlighter.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

const fixtures = [
  '# Title\n\nParagraph with **strong**, _em_, ~~strike~~, and `code`.',
  '```ts title="demo.ts" {1}\nconst value = 1\n```',
  '| A | B |\n| :--- | ---: |\n| one | two |',
  '- [x] done\n- [ ] todo',
  '- [one](/one)\n- [two](/two)',
  '- first\n\n- second',
  '- parent\n  - nested one\n  - nested two\n- sibling',
  '> ## Quote\n>\n> body',
  'One[^note], again[^note].\n\n[^note]: Footnote.',
]

describe('SSR and Octane output equivalence', () => {
  it.each(fixtures)('matches static Octane output for %j', source => {
    const html = normalizeStaticMarkup(renderHtml(source))
    const octane = normalizeStaticMarkup(renderOctane(source))

    expect(octane).toBe(html)
  })

  it('matches code highlighting and docs-extension output', () => {
    const source = `> [!TIP] Cache the AST
> Render it more than once.

\`\`\`ts file="cache.ts" {2}
const one = 1
const two = 2
\`\`\``
    const options = {
      extensions: docsMarkdownExtensions(),
      headingAnchors: true,
      highlighter: externalHighlighter,
    }

    expect(normalizeStaticMarkup(renderOctane(source, options))).toBe(normalizeStaticMarkup(renderHtml(source, options)))
  })

  it('renders trusted raw HTML through Octane dangerous HTML props', () => {
    const source = '<aside data-kind="note">Trusted</aside>'

    expect(renderOctane(source)).toBe('<p>&lt;aside data-kind="note"&gt;Trusted&lt;/aside&gt;</p>')
    expect(renderOctane(source, { allowHtml: true })).toBe('<div><aside data-kind="note">Trusted</aside></div>')
  })

  it('supports Octane component replacements', () => {
    const Link: ComponentBody<any> = props =>
      createElement('a', {
        ...props,
        'data-renderer': 'octane',
      })

    expect(renderOctane('[Guide](/guide)', { components: { a: Link } })).toBe(
      '<p><a href="/guide" data-renderer="octane">Guide</a></p>',
    )
  })

  it('renders the lower-level node API without reparsing', () => {
    function Document() {
      return createElement(Fragment, null, ...renderMarkdownOctane('# Parsed once'))
    }

    expect(renderToStaticMarkup(Document).html).toBe('<h1 id="parsed-once">Parsed once</h1>')
  })
})

function renderOctane(source: string, options: MarkdownOctaneOptions = {}): string {
  return renderToStaticMarkup(Markdown, {
    children: source,
    ...options,
  }).html
}
