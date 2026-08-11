---
title: Document Model
---

# Document Model

`parseMarkdown` returns a `MarkdownDocument`: a plain, serializable object with block nodes under `children`.

```ts group=document-model env=client file=/src/main.ts entry
import { parseMarkdown } from '@tanstack/markdown/parser'

export default function render(output: HTMLElement) {
  output.innerHTML = `
  <style>
    .ast-explorer { display: grid; gap: 12px; }
    .ast-explorer textarea,
    .ast-explorer pre {
      box-sizing: border-box;
      width: 100%;
      margin: 0;
      border: 1px solid color-mix(in srgb, currentColor 22%, transparent);
      border-radius: 8px;
      background: var(--notebook-background);
      color: var(--notebook-foreground);
      font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .ast-explorer textarea { min-height: 90px; padding: 12px; resize: vertical; }
    .ast-explorer pre { max-height: 300px; overflow: auto; padding: 12px; }
  </style>
  <main class="ast-explorer">
    <textarea aria-label="Markdown source"># Hello **world**</textarea>
    <pre aria-label="Parsed Markdown document"></pre>
  </main>
  `

  const source = output.querySelector<HTMLTextAreaElement>('textarea')
  const ast = output.querySelector<HTMLElement>('pre')
  if (!source || !ast) throw new Error('AST explorer controls not found')

  function update() {
    ast.textContent = JSON.stringify(parseMarkdown(source.value), null, 2)
  }

  source.addEventListener('input', update)
  update()
}
```

## Block and inline nodes

Block nodes describe document structure: headings, paragraphs, code, lists, blockquotes, tables, footnotes, thematic breaks, HTML, callouts, and extension components.

Inline nodes describe text flow: text, inline code, emphasis, strong text, strike, links, images, breaks, footnote references, and inline HTML.

Every node has a discriminating `type`, so TypeScript narrows the union naturally:

```ts
for (const block of document.children) {
  if (block.type === 'heading') {
    console.log(block.depth, block.id)
  }
}
```

The complete node contracts are in the [Types Reference](../reference/types).

## Derived document data

Frontmatter is stored as the original string in `document.frontmatter`. TanStack Markdown does not choose a YAML parser or schema for the application.

The heading collection extension adds `document.headings`, a compact array of IDs, text, levels, and optional framework labels.

## Parse once, render many

All renderers accept a source string or a `MarkdownDocument`:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderHtml } from '@tanstack/markdown/html'

const document = parseMarkdown(source)

await cache.set(key, JSON.stringify(document))
const html = renderHtml(document)
```

Parsing once is useful for build pipelines, content indexes, multiple render targets, and high-traffic SSR paths. Rendering a pre-parsed AST is also the fastest measured path in the package.

## Stability

The AST is public and typed, but the package is still pre-1.0. Pin versions when persisting documents across deployments, and regenerate cached AST data when upgrading across a release that changes node contracts.
