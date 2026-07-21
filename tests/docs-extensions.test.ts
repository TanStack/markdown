import { describe, expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { docsMarkdownExtensions } from '../src/extensions/docs.js'

const docs = docsMarkdownExtensions()

describe('docs markdown extensions', () => {
  it('renders GitHub-style callouts', () => {
    const html = renderHtml('> [!TIP] Custom title\n> Use `redirect_from`.', {
      extensions: docs,
    })

    expect(html).toBe('<div class="markdown-alert markdown-alert-tip"><p class="markdown-alert-title">Custom title</p><div class="markdown-alert-content"><p>Use <code>redirect_from</code>.</p></div></div>')
  })

  it('renders heading anchors and collects headings', () => {
    const document = parseMarkdown('# Guide\n\n## Install', {
      extensions: docs,
    })

    expect(document.headings).toEqual([
      { id: 'guide', text: 'Guide', level: 1 },
      { id: 'install', text: 'Install', level: 2 },
    ])
    expect(renderHtml(document, { headingAnchors: true })).toContain(
      '<h2 id="install">Install<a href="#install" aria-hidden="true" class="anchor-heading anchor-heading-link" tabindex="-1">#</a></h2>',
    )
  })

  it('extracts title/file and framework code metadata', () => {
    const document = parseMarkdown('```tsx file="app.tsx" framework="react" {2}\none\ntwo\n```')

    expect(document.children[0]).toMatchObject({
      type: 'code',
      lang: 'tsx',
      title: 'app.tsx',
      file: 'app.tsx',
      framework: 'react',
      highlightLines: [2],
    })

    expect(renderHtml(document)).toContain('data-code-title="app.tsx" data-filename="app.tsx" data-framework="react"')
  })

  it('transforms file tabs from comment components', () => {
    const document = parseMarkdown(
      `<!-- ::start:tabs variant="files" -->

\`\`\`tsx file="app.tsx"
export function App() {}
\`\`\`

\`\`\`css file="styles.css"
body {}
\`\`\`

<!-- ::end:tabs -->`,
      { extensions: docs },
    )

    expect(document.children[0]).toMatchObject({
      type: 'component',
      name: 'tabs',
      properties: {
        'data-attributes': JSON.stringify({
          tabs: [
            { slug: 'file-0', name: 'app.tsx' },
            { slug: 'file-1', name: 'styles.css' },
          ],
        }),
      },
    })
    expect(renderHtml(document)).toContain('data-files-meta=')
    expect(renderHtml(document)).toContain('<md-tab-panel data-tab-slug="file-0" data-tab-index="0">')
  })

  it('transforms package-manager tabs', () => {
    const html = renderHtml(
      `<!-- ::start:tabs variant="package-manager" mode="dev-install" -->

react: @tanstack/react-query
solid: @tanstack/solid-query

<!-- ::end:tabs -->`,
      { extensions: docs },
    )

    expect(html).toContain('data-package-manager-meta=')
    expect(html).toContain('&quot;mode&quot;:&quot;dev-install&quot;')
    expect(html).not.toContain('@tanstack/react-query</p>')
  })

  it('transforms framework panels and skips tab headings in collected headings', () => {
    const document = parseMarkdown(
      `<!-- ::start:framework -->

# React

## Install

\`\`\`tsx title="react.tsx"
react()
\`\`\`

# Solid

## Install

solid()

<!-- ::end:framework -->

<!-- ::start:tabs -->

## Hidden

No TOC.

<!-- ::end:tabs -->`,
      { extensions: docs },
    )

    expect(document.headings).toEqual([
      { id: 'install', text: 'Install', level: 2, framework: 'react' },
      { id: 'install-2', text: 'Install', level: 2, framework: 'solid' },
    ])
    const html = renderHtml(document)
    expect(html).toContain('data-available-frameworks=')
    expect(html).toContain('<md-framework-panel data-framework="react">')
    expect(html).not.toContain('Hidden</h2>')
  })
})
