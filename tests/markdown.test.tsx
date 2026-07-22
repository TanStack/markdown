import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { externalHighlighter } from './helpers/external-highlighter.js'

function compact(html: string): string {
  return html.replace(/>\n</g, '><')
}

describe('TanStack Markdown', () => {
  it('renders docs-flavored markdown deterministically', () => {
    const markdown = `---
title: Example
---

# Hello **World**

Use [TanStack](https://tanstack.com) and \`code\`.

\`\`\`tsx title="example.tsx" {2}
const value = true
export function Demo() {
  return <div>{value}</div>
}
\`\`\`

| Name | Cost |
| :--- | ---: |
| Core | 1kb |

- [x] fast
- [ ] tiny
`

    expect(renderHtml(markdown, { highlighter: externalHighlighter })).toMatchInlineSnapshot(`
      "<h1 id="hello-world">Hello <strong>World</strong></h1>
      <p>Use <a href="https://tanstack.com">TanStack</a> and <code>code</code>.</p>
      <figure class="tm-code-frame" data-lang="tsx"><figcaption>example.tsx</figcaption><pre class="tm-code" data-lang="tsx" data-code-title="example.tsx" data-filename="example.tsx"><code class="language-tsx"><span class="external-line" data-lang="tsx" data-line="1">const value = true</span>
      <span class="external-line external-line-highlight" data-lang="tsx" data-line="2">export function Demo() {</span>
      <span class="external-line" data-lang="tsx" data-line="3">  return &lt;div&gt;{value}&lt;/div&gt;</span>
      <span class="external-line" data-lang="tsx" data-line="4">}</span></code></pre></figure>
      <table><thead><tr><th style="text-align:left">Name</th><th style="text-align:right">Cost</th></tr></thead><tbody><tr><td style="text-align:left">Core</td><td style="text-align:right">1kb</td></tr></tbody></table>
      <ul>
      <li><input type="checkbox" disabled checked> fast</li>
      <li><input type="checkbox" disabled> tiny</li>
      </ul>"
    `)
  })

  it('keeps task list labels inline with their checkboxes', () => {
    const markdown = `- [ ] **Bundle Analysis:** Verify server-only code isn't in client bundle
- [x] Environment Variables: Use \`createServerOnlyFn()\``

    expect(renderHtml(markdown)).toBe(`<ul>
<li><input type="checkbox" disabled> <strong>Bundle Analysis:</strong> Verify server-only code isn&#39;t in client bundle</li>
<li><input type="checkbox" disabled checked> Environment Variables: Use <code>createServerOnlyFn()</code></li>
</ul>`)

    const reactHtml = renderToStaticMarkup(<Markdown>{markdown}</Markdown>)
    expect(reactHtml).toContain('<li><input type="checkbox" disabled="" readOnly=""/> <strong>Bundle Analysis:</strong>')
    expect(reactHtml).not.toContain('<input type="checkbox" disabled="" readOnly=""/> <p>')
  })

  it('keeps loose task labels and checkboxes in the same paragraph', () => {
    const markdown = `- [ ] First task

- [x] Second task`
    const html = `<ul>
<li><p><input type="checkbox" disabled> First task</p></li>
<li><p><input type="checkbox" disabled checked> Second task</p></li>
</ul>`

    expect(renderHtml(markdown)).toBe(html)
    expect(renderToStaticMarkup(<Markdown>{markdown}</Markdown>)).toBe(
      '<ul><li><p><input type="checkbox" disabled="" readOnly=""/> First task</p></li><li><p><input type="checkbox" disabled="" readOnly="" checked=""/> Second task</p></li></ul>',
    )
  })

  it('parses compact table alignment delimiters used by existing docs', () => {
    const markdown = `| id | list_id | completed |
|:--:|:-------:|:---------:|
| 1 | list_1 | 0 |`

    expect(renderHtml(markdown)).toBe(
      '<table><thead><tr><th style="text-align:center">id</th><th style="text-align:center">list_id</th><th style="text-align:center">completed</th></tr></thead><tbody><tr><td style="text-align:center">1</td><td style="text-align:center">list_1</td><td style="text-align:center">0</td></tr></tbody></table>',
    )
  })

  it('renders footnotes in first-reference order', () => {
    const markdown = `Alpha[^later] beta[^first].

[^first]: First note.
[^later]: [Later note](/later).`

    expect(renderHtml(markdown)).toBe(`<p>Alpha<sup><a id="user-content-fnref-later" data-footnote-ref="" aria-describedby="footnote-label" href="#user-content-fn-later">1</a></sup> beta<sup><a id="user-content-fnref-first" data-footnote-ref="" aria-describedby="footnote-label" href="#user-content-fn-first">2</a></sup>.</p>
<section data-footnotes="" class="footnotes"><h2 id="footnote-label" class="sr-only">Footnotes</h2>
<ol>
<li id="user-content-fn-later">
<p><a href="/later">Later note</a>. <a data-footnote-backref="" aria-label="Back to reference 1" class="data-footnote-backref" href="#user-content-fnref-later">&#8617;</a></p>
</li>
<li id="user-content-fn-first">
<p>First note. <a data-footnote-backref="" aria-label="Back to reference 2" class="data-footnote-backref" href="#user-content-fnref-first">&#8617;</a></p>
</li>
</ol>
</section>`)
  })

  it('omits tanstack.com section markers written as link reference definitions', () => {
    expect(renderHtml("[//]: # 'ExampleUI1'")).toBe('')
  })

  it('renders repeated footnotes without duplicate ids', () => {
    const markdown = `One[^note], then again[^note].

[^note]: Footnote.`
    const html = renderHtml(markdown)

    expect(html).toContain('id="user-content-fnref-note"')
    expect(html).toContain('id="user-content-fnref-note-2"')
    expect(html.match(/id="user-content-fnref-note"/g)).toHaveLength(1)
    expect(html).toContain('href="#user-content-fnref-note"')
    expect(html).toContain('href="#user-content-fnref-note-2"')
  })

  it('gives colliding footnote labels distinct ids', () => {
    const html = renderHtml(`A[^a b], B[^a-b], C[^\u65e5\u672c\u8a9e], D[^\u97d3\u56fd\u8a9e].

[^a b]: Space.
[^a-b]: Hyphen.
[^\u65e5\u672c\u8a9e]: Japanese.
[^\u97d3\u56fd\u8a9e]: Korean.`)

    expect(html).toContain('id="user-content-fn-a-b"')
    expect(html).toContain('id="user-content-fn-a-b-2"')
    expect(html).toContain('id="user-content-fn-footnote"')
    expect(html).toContain('id="user-content-fn-footnote-2"')
  })

  it('supports legacy single-tilde strike markup in headings', () => {
    const document = parseMarkdown('### Server ~Actions~ Functions')

    expect(document.children).toMatchObject([
      {
        type: 'heading',
        id: 'server-actions-functions',
        children: [
          { type: 'text', value: 'Server ' },
          { type: 'strike', children: [{ type: 'text', value: 'Actions' }] },
          { type: 'text', value: ' Functions' },
        ],
      },
    ])
    expect(renderHtml(document)).toBe('<h3 id="server-actions-functions">Server <del>Actions</del> Functions</h3>')
  })

  it('renders tight list paragraph content directly inside list items', () => {
    const markdown = `- [Execution Model](/x) - Core concepts
- [Server Functions](/y) - Deep dive`
    const html = `<ul>
<li><a href="/x">Execution Model</a> - Core concepts</li>
<li><a href="/y">Server Functions</a> - Deep dive</li>
</ul>`

    expect(renderHtml(markdown)).toBe(html)
    expect(renderToStaticMarkup(<Markdown>{markdown}</Markdown>)).toBe(compact(html))
  })

  it('renders tight ordered list paragraph content directly inside list items', () => {
    const markdown = `1. [Execution Model](/x) - Core concepts
2. [Server Functions](/y) - Deep dive`
    const html = `<ol>
<li><a href="/x">Execution Model</a> - Core concepts</li>
<li><a href="/y">Server Functions</a> - Deep dive</li>
</ol>`

    expect(renderHtml(markdown)).toBe(html)
    expect(renderToStaticMarkup(<Markdown>{markdown}</Markdown>)).toBe(compact(html))
  })

  it('keeps paragraph wrappers in loose lists', () => {
    const markdown = `- [Execution Model](/x) - Core concepts

- **Server Functions** - Deep dive`
    const html = `<ul>
<li><p><a href="/x">Execution Model</a> - Core concepts</p></li>
<li><p><strong>Server Functions</strong> - Deep dive</p></li>
</ul>`

    expect(renderHtml(markdown)).toBe(html)
    expect(renderToStaticMarkup(<Markdown>{markdown}</Markdown>)).toBe(compact(html))
  })

  it('ends a list before an unindented block after a blank line', () => {
    const markdown = `- List item

Outside paragraph

- Next item

# Outside heading`
    const html = `<ul>
<li>List item</li>
</ul>
<p>Outside paragraph</p>
<ul>
<li>Next item</li>
</ul>
<h1 id="outside-heading">Outside heading</h1>`

    expect(renderHtml(markdown)).toBe(html)
    expect(renderToStaticMarkup(<Markdown>{markdown}</Markdown>)).toBe(compact(html))
  })

  it('does not merge lists with different marker styles', () => {
    expect(renderHtml('- one\n* two')).toBe(`<ul>
<li>one</li>
</ul>
<ul>
<li>two</li>
</ul>`)
    expect(renderHtml('1. one\n2) two')).toBe(`<ol>
<li>one</li>
</ol>
<ol start="2">
<li>two</li>
</ol>`)
  })

  it('escapes unsafe html and urls by default', () => {
    const html = renderHtml(`<img src=x onerror=alert(1)>

[bad](javascript:alert(1))

![bad](javascript:alert(1))`)

    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
    expect(html).not.toContain('javascript:')
    expect(html).toContain('<img src="" alt="bad">')
  })

  it('can explicitly allow raw html', () => {
    expect(renderHtml('<div data-x="1">ok</div>', { allowHtml: true })).toBe('<div data-x="1">ok</div>')
  })

  it('serializes to a reusable AST', () => {
    const document = parseMarkdown('# One\n\n## One')
    expect(document.children).toMatchObject([
      { type: 'heading', id: 'one' },
      { type: 'heading', id: 'one-2' },
    ])
    expect(renderHtml(document)).toBe('<h1 id="one">One</h1>\n<h2 id="one-2">One</h2>')
  })

  it('renders React without random output', () => {
    const markdown = '# Hi\n\n```ts\nconst value = 1\n```'
    const first = renderToStaticMarkup(<Markdown highlighter={externalHighlighter}>{markdown}</Markdown>)
    const second = renderToStaticMarkup(<Markdown highlighter={externalHighlighter}>{markdown}</Markdown>)
    expect(second).toBe(first)
    expect(first).toContain('<h1 id="hi">Hi</h1>')
    expect(first).toContain('class="external-line"')
  })

  it('does not import highlighting into the default html path', () => {
    expect(renderHtml('```ts\nconst value = 1\n```')).toBe(
      '<pre class="tm-code" data-lang="ts"><code class="language-ts">const value = 1</code></pre>',
    )
  })
})

describe('pluggable code highlighting', () => {
  it('passes language, line numbers, and highlighted lines to the external highlighter', () => {
    const html = renderHtml('```ts {2}\none\ntwo\n```', {
      codeLineNumbers: true,
      highlighter: externalHighlighter,
    })

    expect(html).toContain('data-lang="ts"')
    expect(html).toContain('external-line-number')
    expect(html).toContain('external-line-highlight')
  })
})
