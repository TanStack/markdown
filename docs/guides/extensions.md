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

The hook runs once per inline container. Recurse through inline `children` when your transform also needs to handle content inside emphasis or links. Code spans and image alt text are not separate inline containers.

## Document transformation

`transformDocument` runs after all blocks and footnotes are built. Return a new `MarkdownDocument`, mutate and return nothing, or leave the document unchanged. The built-in heading collector uses this phase.

## HTML rendering

`renderHtml` runs before built-in HTML node rendering. Return a string to claim the node or `undefined` to continue with the standard renderer. The context can render nested block and inline nodes.

This hook is HTML-specific. Returned HTML is trusted and is not sanitized.

## Custom components

Use `ComponentNode` for block content and `InlineComponentNode` for inline content. Both carry a `name`, source `attributes`, rendered string `properties`, and an optional `tagName`. Inline components have inline `children`, so they can appear in paragraphs, headings, links, and table cells without adding block wrappers.

```ts
import type { InlineComponentNode } from '@tanstack/markdown'

const badge: InlineComponentNode = {
  type: 'inlineComponent',
  name: 'status',
  tagName: 'md-status',
  attributes: {},
  properties: { 'data-state': 'ready' },
  children: [{ type: 'text', value: 'Ready' }],
}
```

An inline transform can return this node alongside ordinary text. The HTML renderer emits `<md-status data-state="ready">Ready</md-status>`. React and Octane use the same tag by default; map `'md-status'` through their `components` option to replace it. An HTML `renderHtml` hook can replace the same node for non-framework output.

Without `tagName`, inline components fall back to `<span>` and block components to `<md-comment-component>`, with `data-component` and JSON `data-attributes`. Values and text children are escaped. Tag and property names come from trusted extension code, not untrusted Markdown. Choose phrasing tags and inline-compatible replacements for inline nodes.

These nodes are JSON-serializable and do not require `allowHtml`. Math parsing and rendering can use them in an opt-in extension, but neither a math parser nor a rendering engine is included in the core.

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
