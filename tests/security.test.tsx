import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'

describe('security policy', () => {
  it('drops executable link protocols', () => {
    const html = renderHtml(`[one](javascript:alert(1))

[two](JaVaScRiPt:alert(1))

[three](java\u0000script:alert(1))

![img](javascript:alert(1))

[four][unsafe]

![img][unsafe]

[unsafe]: javascript:alert(1)`)

    expect(html).toBe(`<p>one</p>
<p>two</p>
<p>three</p>
<p><img src="" alt="img"></p>
<p>four</p>
<p><img src="" alt="img"></p>`)
  })

  it('does not double escape React output when a precompiled html node is rendered with html disabled', () => {
    const document = parseMarkdown('<aside>Trusted at compile time</aside>', { allowHtml: true })
    const react = renderToStaticMarkup(<Markdown>{document}</Markdown>)

    expect(renderHtml(document)).toBe('&lt;aside&gt;Trusted at compile time&lt;/aside&gt;')
    expect(react).toBe('<p>&lt;aside&gt;Trusted at compile time&lt;/aside&gt;</p>')
  })

  it('allows raw html only when explicitly requested', () => {
    const source = '<aside data-kind="note">ok</aside>'

    expect(renderHtml(source)).toBe('<p>&lt;aside data-kind=&quot;note&quot;&gt;ok&lt;/aside&gt;</p>')
    expect(renderHtml(source, { allowHtml: true })).toBe(source)
  })
})
