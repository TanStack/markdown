---
title: Document Model
---

# Document Model

`parseMarkdown` returns a `MarkdownDocument`: a plain, serializable object with block nodes under `children`.

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'

const document = parseMarkdown('# Hello **world**')

// {
//   type: 'root',
//   children: [
//     {
//       type: 'heading',
//       depth: 1,
//       id: 'hello-world',
//       children: [
//         { type: 'text', value: 'Hello ' },
//         { type: 'strong', children: [{ type: 'text', value: 'world' }] },
//       ],
//     },
//   ],
// }
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

Both renderers accept a source string or a `MarkdownDocument`:

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
