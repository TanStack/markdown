import { createElement as createReactElement } from 'react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup as renderReact } from 'react-dom/server'
import { createElement as createOctaneElement } from 'octane'
import type { OctaneNode } from 'octane'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it, vi } from 'vitest'
import { renderHtml } from '../src/html.js'
import { parseMarkdown } from '../src/parser.js'
import { Markdown as ReactMarkdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import type { CodeHighlighter, InlineComponentNode, InlineNode, MarkdownDocument, MarkdownExtension, RenderOptions } from '../src/types.js'
import { headingCollectionExtension } from '../src/extensions/headings.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

function renderAll(source: string | MarkdownDocument, options: RenderOptions = {}) {
  const html = renderHtml(source, options)
  expect(normalizeStaticMarkup(renderReact(createReactElement(ReactMarkdown, { children: source, ...options })))).toBe(normalizeStaticMarkup(html))
  expect(normalizeStaticMarkup(renderOctane(OctaneMarkdown, { children: source, ...options }).html)).toBe(normalizeStaticMarkup(html))
  return html
}

describe('GitHub issue triage', () => {
  it.each([
    ['*a **b** c*', '<em>a <strong>b</strong> c</em>'],
    ['*see **the docs** here*', '<em>see <strong>the docs</strong> here</em>'],
    ['_italic __bold__ tail_', '<em>italic <strong>bold</strong> tail</em>'],
    ['*outer **inner***', '<em>outer <strong>inner</strong></em>'],
  ])('keeps the closed nested-emphasis report fixed: %s (#2)', (source, expected) => {
    expect(renderAll(source)).toBe(`<p>${expected}</p>`)
  })

  it.each(['\n', '\r\n', '\r'])('normalizes line endings without losing content: %j (#6)', newline => {
    expect(renderAll(`first${newline}second${newline}${newline}third`)).toBe('<p>first\nsecond</p>\n<p>third</p>')
  })

  it('preserves raw code metadata for applications rendering an AST (#7)', () => {
    const source = '```js renderer="demo" {1}\nconsole.log(1)\n```'
    const document = parseMarkdown(source)
    expect(document.children[0]).toEqual({
      type: 'code', value: 'console.log(1)', lang: 'js', meta: 'renderer="demo" {1}', highlightLines: [1],
    })
    expect(renderAll(JSON.parse(JSON.stringify(document)))).toBe(renderHtml(source))
  })

  it('forwards escaped fence metadata to pre elements and unescaped metadata to highlighters (#7)', () => {
    const meta = 'renderer="demo" {1} & <unsafe>'
    const highlighter = vi.fn<CodeHighlighter>(() => '<b>highlighted</b>')
    const html = renderAll(`\`\`\`js ${meta}\nconsole.log(1)\n\`\`\``, { highlighter, codeLineNumbers: false })
    expect(html).toContain('data-meta="renderer=&quot;demo&quot; {1} &amp; &lt;unsafe&gt;"')
    expect(html).toContain('<code class="language-js"><b>highlighted</b></code>')
    expect(highlighter).toHaveBeenCalledTimes(3)
    for (const call of highlighter.mock.calls) {
      expect(call).toEqual(['console.log(1)', 'js', { meta, highlightLines: [1], lineNumbers: false }])
    }
  })

  it('exposes fence metadata to framework pre replacements (#7)', () => {
    const source = '> ```js renderer="demo"\n> code\n> ```'
    const reactMeta: unknown[] = []
    const octaneMeta: unknown[] = []
    renderReact(createReactElement(ReactMarkdown, { children: source, components: {
      pre: (props: Record<string, unknown>) => {
        reactMeta.push(props['data-meta'])
        return createReactElement('pre', null, 'replacement')
      },
    } }))
    renderOctane(OctaneMarkdown, { children: source, components: {
      pre: (props: Record<string, unknown>) => {
        octaneMeta.push(props['data-meta'])
        return createOctaneElement('pre', null, 'replacement')
      },
    } })
    expect(reactMeta).toEqual(['renderer="demo"'])
    expect(octaneMeta).toEqual(reactMeta)
  })

  it('leaves metadata-free code output and highlighter options unchanged (#7)', () => {
    const highlighter = vi.fn(() => 'code')
    expect(renderAll('```js\ncode\n```', { highlighter })).toBe('<pre class="tm-code" data-lang="js"><code class="language-js">code</code></pre>')
    expect(highlighter).toHaveBeenCalledWith('code', 'js', {})
  })

  it('renders application-validated data images through the existing AST input (#11)', () => {
    const src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='
    const document: MarkdownDocument = { type: 'root', children: [{ type: 'paragraph', children: [{
      type: 'image', src, alt: 'Pixel',
    }] }] }
    expect(renderAll(document)).toBe(`<p><img src="${src}" alt="Pixel"></p>`)
    expect(renderHtml(`![Pixel](${src})`)).toBe('<p><img src="" alt="Pixel"></p>')
    expect(renderHtml('[unsafe](javascript:alert%281%29)')).toBe('<p>unsafe</p>')
  })

  it('supports semantic block components without enabling raw HTML (#13)', () => {
    const document: MarkdownDocument = { type: 'root', children: [{
      type: 'component', name: 'math', tagName: 'math-block', attributes: {},
      properties: { tex: 'E = mc^2 <script>' }, children: [],
    }] }
    expect(renderAll(document)).toBe('<math-block tex="E = mc^2 &lt;script&gt;"></math-block>')
    const react = renderReact(createReactElement(ReactMarkdown, { children: document, components: {
      'math-block': ({ tex }: { tex: string }) => createReactElement('span', null, tex),
    } }))
    const octane = renderOctane(OctaneMarkdown, { children: document, components: {
      'math-block': ({ tex }: { tex: string }) => createOctaneElement('span', null, tex),
    } }).html
    expect(react).toBe('<span>E = mc^2 &lt;script&gt;</span>')
    expect(octane).toBe(react)
  })

  it('renders nested inline components as escaped, serializable phrasing content (#9)', () => {
    const node: InlineComponentNode = {
      type: 'inlineComponent', name: 'badge', attributes: { label: '"<>&' },
      properties: { 'data-status': '"<>&' }, children: [
        { type: 'text', value: 'before ' },
        { type: 'inlineComponent', name: 'inner', tagName: 'mark', attributes: {}, children: [
          { type: 'strong', children: [{ type: 'text', value: '<ready>' }] },
        ] },
        { type: 'text', value: ' after' },
      ],
    }
    const document: MarkdownDocument = { type: 'root', children: [{ type: 'paragraph', children: [node] }] }
    const html = renderAll(JSON.parse(JSON.stringify(document)))
    expect(html).toBe('<p><span data-status="&quot;&lt;&gt;&amp;" data-component="badge" data-attributes="{&quot;label&quot;:&quot;\\&quot;&lt;&gt;&amp;&quot;}">before <mark><strong>&lt;ready&gt;</strong></mark> after</span></p>')
    expect(renderAll(document)).toBe(html)
  })

  it('uses inline transforms in headings, links, emphasis, lists, and table cells (#9)', () => {
    const badge: InlineComponentNode = {
      type: 'inlineComponent', name: 'badge', tagName: 'md-badge', attributes: {},
      properties: { 'data-status': 'ready' }, children: [{ type: 'text', value: 'Ready' }],
    }
    const replace = (nodes: InlineNode[]): InlineNode[] => nodes.map(node => {
      if (node.type === 'text' && node.value === ':ready:') return badge
      return 'children' in node ? { ...node, children: replace(node.children) } : node
    })
    const extension: MarkdownExtension = { name: 'badge', transformInline: replace }
    const source = '# :ready:\n\n[:ready:](/docs) and **:ready:**\n\n- :ready:\n\n| Status |\n| --- |\n| :ready: |'
    const document = parseMarkdown(source, { extensions: [extension, headingCollectionExtension()] })
    expect(document.headings).toEqual([{ id: 'ready', text: 'Ready', level: 1 }])
    const html = renderAll(document)
    const tag = '<md-badge data-status="ready">Ready</md-badge>'
    expect(html).toContain(`<h1 id="ready">${tag}</h1>`)
    expect(html).toContain(`<a href="/docs">${tag}</a> and <strong>${tag}</strong>`)
    expect(html).toContain(`<li>${tag}</li>`)
    expect(html).toContain(`<td>${tag}</td>`)
    expect(renderAll(source, { extensions: [extension] })).toBe(html)

    const react = renderReact(createReactElement(ReactMarkdown, { children: document, components: {
      'md-badge': ({ children, ...props }: { children: ReactNode; 'data-status': string }) => createReactElement('mark', props, children),
    } }))
    const octane = renderOctane(OctaneMarkdown, { children: document, components: {
      'md-badge': ({ children, ...props }: { children: OctaneNode; 'data-status': string }) => createOctaneElement('mark', props, children),
    } }).html
    const htmlOptions: RenderOptions = { extensions: [{ name: 'badge-html', renderHtml(node, context) {
      if (node.type === 'inlineComponent' && node.name === 'badge') {
        return `<mark data-status="ready">${node.children.map(context.renderInline).join('')}</mark>`
      }
    } }] }
    expect(normalizeStaticMarkup(react)).toBe(normalizeStaticMarkup(renderHtml(document, htmlOptions)))
    expect(normalizeStaticMarkup(octane)).toBe(normalizeStaticMarkup(react))
  })
})
