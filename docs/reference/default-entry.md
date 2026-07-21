---
title: Default Entry
---

# Default Entry

`@tanstack/markdown` re-exports the parser, inline parser, HTML renderer, and all shared public types.

```ts
import {
  parseInline,
  parseMarkdown,
  renderBlock,
  renderDocument,
  renderHtml,
  renderInline,
  type MarkdownDocument,
  type RenderOptions,
} from '@tanstack/markdown'
```

## Parsing exports

### `parseMarkdown`

```ts
function parseMarkdown(
  markdown: string,
  options?: ParseOptions,
): MarkdownDocument
```

Parses a complete Markdown document. See the [Parser Reference](parser).

### `parseInline`

```ts
function parseInline(value: string, options?: ParseOptions): InlineNode[]
```

Parses inline content without block parsing. It is useful inside custom extension parsers. Standalone calls do not perform document-level link-definition or footnote extraction unless the relevant parser state is supplied in `ParseOptions`.

## HTML exports

### `renderHtml`

Renders a source string or `MarkdownDocument` to HTML.

### `renderDocument`

Renders a `MarkdownDocument`. It is a document-specific alias over `renderHtml`.

### `renderBlock`

Renders one `BlockNode` to HTML.

### `renderInline`

Renders one `InlineNode` to HTML.

Signatures and rendering options are documented in the [HTML Reference](html).

## Type exports

The default entry exports every AST node, parser context, render option, extension contract, and supporting definition from the [Types Reference](types).
