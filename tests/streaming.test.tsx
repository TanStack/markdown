import { performance } from 'node:perf_hooks'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { streamingMarkdownExtension } from '../src/extensions/streaming.js'
import { renderHtml } from '../src/html.js'
import { Markdown } from '../src/react.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

const extensions = [streamingMarkdownExtension()]

describe('AI streaming profile', () => {
  it('renders every response prefix deterministically, safely, and with React parity', () => {
    const source = `# Streaming response

Here is **the answer** with [a link](https://example.com) and \`inline code\`.

- First item
- Second item with ~~old text~~
- [x] Completed task

> A quoted explanation

| Option | Result |
| --- | --- |
| Fast | Yes |

\`\`\`ts
const answer = "<safe>"
\`\`\`

[unsafe](javascript:alert(1))

<script>alert("no")</script>`

    let prefix = ''
    for (const character of source) {
      prefix += character
      const first = renderHtml(prefix, { extensions })
      const second = renderHtml(prefix, { extensions })
      const react = renderToStaticMarkup(<Markdown extensions={extensions}>{prefix}</Markdown>)

      expect(second).toBe(first)
      expect(normalizeStaticMarkup(react)).toBe(normalizeStaticMarkup(first))
      expect(first).not.toContain('href="javascript:')
      expect(first).not.toContain('<script>')
    }
  })

  it('keeps accumulated fenced code visible before the closing fence arrives', () => {
    const source = '```ts\nconst answer = 42'

    expect(renderHtml(source, { extensions })).toBe('<pre class="tm-code" data-lang="ts"><code class="language-ts">const answer = 42</code></pre>')
  })

  it.each([
    ['strong', '**partial bold'],
    ['emphasis', '_partial emphasis'],
    ['code span', '`partial code'],
    ['link', '[partial link](https://example.com'],
  ])('keeps an unclosed %s visible as literal text', (_, source) => {
    const html = renderHtml(source, { extensions })

    expect(html).toContain(source.replaceAll('<', '&lt;').replaceAll('>', '&gt;'))
  })

  it.each([
    ['bare unordered item', '-', ''],
    ['unordered item', '- ', ''],
    ['asterisk item', '* ', ''],
    ['plus item', '+ ', ''],
    ['bare ordered item', '1.', ''],
    ['ordered item', '1. ', ''],
    ['heading', '# ', ''],
    ['blockquote', '> ', ''],
    ['unordered continuation', '- alpha\n- ', '<ul>\n<li>alpha</li>\n</ul>'],
    ['ordered continuation', '1. alpha\n2. ', '<ol>\n<li>alpha</li>\n</ol>'],
    ['nested continuation', '- alpha\n  - beta\n  - ', '<ul>\n<li>alpha\n<ul>\n<li>beta</li>\n</ul></li>\n</ul>'],
  ])('suppresses a trailing empty %s while streaming', (_, source, expected) => {
    expect(renderHtml(source, { extensions })).toBe(expected)
  })

  it('does not change completed Markdown output', () => {
    const source = `# Answer

1. First
2. Second

> Complete

\`\`\`js
console.log('done')
\`\`\``

    expect(renderHtml(source, { extensions })).toBe(renderHtml(source))
  })

  it('keeps progressive full-response rendering bounded', () => {
    const source = Array.from(
      { length: 80 },
      (_, index) => `## Result ${index + 1}\n\n- Detail with **emphasis**\n- [Reference](https://example.com/${index + 1})\n\n`,
    ).join('')
    const chunkSize = 32
    const start = performance.now()

    for (let end = chunkSize; end < source.length; end += chunkSize) {
      renderHtml(source.slice(0, end), { extensions })
    }
    renderHtml(source, { extensions })

    expect(performance.now() - start).toBeLessThan(500)
  })
})
