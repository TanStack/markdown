import { describe, expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'

describe('docs markdown fixtures', () => {
  it('extracts frontmatter without rendering it', () => {
    const document = parseMarkdown('---\ntitle: Test\n---\n\n# Title')

    expect(document.frontmatter).toBe('title: Test')
    expect(renderHtml(document)).toBe('<h1 id="title">Title</h1>')
  })

  it('renders nested lists, ordered starts, and task items', () => {
    const markdown = `3. First
   - Nested
   - [x] Done
4. Second`

    expect(renderHtml(markdown)).toBe(`<ol start="3">
<li>First
<ul>
<li>Nested</li>
<li><input type="checkbox" disabled checked> Done</li>
</ul></li>
<li>Second</li>
</ol>`)
  })

  it('renders blockquotes with nested blocks', () => {
    const markdown = `> ## Note
>
> - one
> - two`

    expect(renderHtml(markdown)).toBe(`<blockquote>
<h2 id="note">Note</h2>
<ul>
<li>one</li>
<li>two</li>
</ul>
</blockquote>`)
  })

  it('resolves reference links and images in comparison tables', () => {
    const markdown = `| Product | Stars | Bundle | Routing |
| --- | --- | --- | --- |
| TanStack Start | [![][stars-tanstack-router]][gh-tanstack-router] | [![][bp-tanstack-router]][bpl-tanstack-router] | **Routing Features** [_(See Full Comparison)_][router-comparison] |
| Next.js [_(Website)_][nextjs] | [![][stars-nextjs]][gh-nextjs] | ❓ | ✅ File-based App Router |

[bp-tanstack-router]: https://badgen.net/bundlephobia/minzip/@tanstack/react-router
[bpl-tanstack-router]: https://bundlephobia.com/result?p=@tanstack/react-router
[gh-tanstack-router]: https://github.com/tanstack/router
[stars-tanstack-router]: https://img.shields.io/github/stars/tanstack/router?label=%F0%9F%8C%9F
[router-comparison]: /router/latest/docs/framework/react/comparison
[nextjs]: https://nextjs.org/
[gh-nextjs]: https://github.com/vercel/next.js
[stars-nextjs]: https://img.shields.io/github/stars/vercel/next.js?label=%F0%9F%8C%9F`

    const html = renderHtml(markdown)

    expect(html).toContain(
      '<td><a href="https://github.com/tanstack/router"><img src="https://img.shields.io/github/stars/tanstack/router?label=%F0%9F%8C%9F" alt=""></a></td>',
    )
    expect(html).toContain(
      '<td><a href="https://bundlephobia.com/result?p=@tanstack/react-router"><img src="https://badgen.net/bundlephobia/minzip/@tanstack/react-router" alt=""></a></td>',
    )
    expect(html).toContain(
      '<td><strong>Routing Features</strong> <a href="/router/latest/docs/framework/react/comparison"><em>(See Full Comparison)</em></a></td>',
    )
    expect(html).toContain('<td>Next.js <a href="https://nextjs.org/"><em>(Website)</em></a></td>')
    expect(html).not.toContain('[stars-tanstack-router]')
    expect(html).not.toContain('[gh-tanstack-router]:')
  })

  it('parses code metadata and line ranges', () => {
    const document = parseMarkdown('```tsx title="demo.tsx" {1,3-4}\none\ntwo\nthree\nfour\n```')
    expect(document.children[0]).toMatchObject({
      type: 'code',
      lang: 'tsx',
      title: 'demo.tsx',
      highlightLines: [1, 3, 4],
    })
  })

  it('keeps malformed markdown deterministic and escaped', () => {
    const html = renderHtml(`This has **open strong and [bad](https://example.com

<script>alert(1)</script>`)

    expect(html).toBe(`<p>This has **open strong and [bad](https://example.com</p>
<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>`)
  })

  it('supports lightweight extension hooks', () => {
    const html = renderHtml(':::note\nUse cache\n:::', {
      extensions: [
        {
          name: 'note',
          parseBlock(context) {
            if (context.lines[context.index] !== ':::note') return undefined
            const body = context.lines[context.index + 1] ?? ''
            context.consume(3)
            return {
              type: 'paragraph',
              children: [{ type: 'strong', children: context.parseInline(body) }],
            }
          },
        },
      ],
    })

    expect(html).toBe('<p><strong>Use cache</strong></p>')
  })
})
