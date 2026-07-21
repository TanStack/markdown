---
title: Extensions
---

# Extensions

Extensions are small synchronous hooks for profile-specific syntax. They are intentionally narrower than a general content-processing pipeline.

```ts
import type { MarkdownExtension } from '@tanstack/markdown'

const extension: MarkdownExtension = {
  name: 'example',
  parseBlock(context) {
    return undefined
  },
  transformInline(nodes) {
    return nodes
  },
  transformDocument(document) {
    return document
  },
  renderHtml(node, context) {
    return undefined
  },
}
```

## Block parsing

`parseBlock` runs before built-in block parsing at the current source line. Return `undefined` when the extension does not own that line. When returning a node, call `context.consume(count)` with the number of source lines consumed.

The context includes:

- `lines` and the current `index`
- the active parse `options`
- `parseInline(value)` for inline children
- `parseBlocks(value)` for nested block content
- `consume(lines)` for advancing the parent parser

Nested parsing shares the parser depth budget and heading slugger.

## Inline transformation

`transformInline` receives built-in inline nodes after parsing. Return the replacement array. Keep transforms deterministic and avoid repeated full-array scans for every node.

## Document transformation

`transformDocument` runs after all blocks and footnotes are built. Return a new `MarkdownDocument`, mutate and return nothing, or leave the document unchanged. The built-in heading collector uses this phase.

## HTML rendering

`renderHtml` runs before built-in HTML node rendering. Return a string to claim the node or `undefined` to continue with the standard renderer. The context can render nested block and inline nodes.

This hook is HTML-specific. A custom node intended for both outputs should use a `ComponentNode` and map its tag through React `components`, or maintain an explicit React rendering layer. Returned HTML is trusted and is not sanitized.

## Ordering

Extensions run in array order. Put more specific parsers before more general parsers, and use stable extension arrays for parsing and source-string rendering:

```ts
const extensions = [callouts, customComponents]
const document = parseMarkdown(source, { extensions })
const html = renderHtml(document, { extensions })
```

Document transforms are already represented in a pre-parsed AST. HTML render hooks still need to be present when that AST is rendered.

## Admission rule

An extension is appropriate when syntax is broadly useful to docs, has a deterministic block boundary, and does not justify cost in the core entry. Use a larger processing ecosystem when the job requires async plugins, arbitrary tree pipelines, compiler integration, or MDX evaluation.
