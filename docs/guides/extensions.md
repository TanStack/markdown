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

## Inline source parsing

Use `inlineParser` when syntax must see source characters before they become emphasis, links, or decoded escapes. `transformInline` cannot recover an escaped opener or the original spelling of an already-parsed node.

```ts
import type { MarkdownExtension } from '@tanstack/markdown'

const issueReferences: MarkdownExtension = {
  name: 'issue-references',
  inlineParser: {
    markers: '#',
    parse({ source, index, inLink }) {
      if (inLink) return undefined
      const match = /^#([0-9]+)\b/.exec(source.slice(index))
      if (!match) return undefined
      return {
        length: match[0].length,
        node: {
          type: 'link',
          href: `/issues/${match[1]}`,
          children: [{ type: 'text', value: match[0] }],
        },
      }
    },
  },
}
```

`markers` lists literal possible first characters, not a regular expression. The parser skips ordinary text to the next built-in or extension marker. At a matching position, extensions run in array order after built-in escapes and code spans, before the other built-in inline rules. The first returned result owns that range. Return `undefined` to let the next extension or built-in rule handle it.

The context provides `source`, `index`, `options`, `inLink`, and a nested `parseInline(value)` helper. Source and UTF-16 indices refer to the current inline container, not offsets in the original document. Hooks also run within emphasis and explicit link labels; `inLink` remains true through their nested content. They do not run inside code, image alt text, or link destinations. A hook cannot consume across an enclosing inline or block boundary.

Return one standard `InlineNode` and a positive integer `length` within the remaining source. Invalid lengths throw `RangeError`. The child parser shares the existing depth and scan limits; use that helper instead of calling the top-level parser recursively. Hook dispatch counts against the scan budget. Extension code remains trusted: these limits do not bound work done inside a callback. Keep recognition deterministic and avoid repeatedly scanning a suffix after unsuccessful matches.

Returned nodes follow the same trust contract as supplied ASTs: URL destinations and component names/properties must be validated by the extension. The fixed, numeric issue path above needs no user-supplied URL. Extensions accepting arbitrary URLs should use the application URL policy. Return a portable `InlineComponentNode` for custom presentation; no HTML renderer changes are required.

## Optional URL linking

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { autolinksExtension } from '@tanstack/markdown/extensions/autolinks'

const html = renderHtml('See https://example.com/~alice~/notes.', {
  extensions: [autolinksExtension()],
})
```

This extension recognizes bare HTTP(S) URLs and `<http://…>` / `<https://…>` notation, without changing the core or docs-preset defaults. URLs retain their original source spelling, including Markdown punctuation. Host/port validity follows the platform `URL` implementation. Link nodes pass through the existing `urlTransform(url, 'link', defaultUrl)` policy and render consistently in HTML, React, and Octane; `null` keeps only the URL label. Application replacements remain trusted, as with explicit links.

The bounded profile is intentionally smaller than GFM autolink literals:

- Bare links must start at the container boundary or after punctuation/whitespace, excluding letters, numbers, `_`, `/`, `@`, `<`, and backslash. They stop at whitespace, controls, quotes, backticks, backslashes, angle brackets, or an unmatched closing parenthesis/bracket/brace.
- Balanced parentheses, brackets, and braces stay in bare URLs. Trailing `. , ! ? ; :` characters stay outside the link. Use angle notation or an explicit Markdown link when those trailing characters belong to the URL.
- Angle notation preserves trailing punctuation and requires a closing `>` before whitespace, controls, quotes, backticks, backslashes, or another `<`. Escaping the opening `<` keeps it literal.
- Explicit links (including their formatted labels), images, code, destinations, and enabled raw HTML are handled by the existing parser. Autolinks also work in ordinary emphasis, headings, lists, quotes, and table cells, within the enclosing inline boundaries.
- `www.` addresses, email detection, other schemes, entity decoding, and full CommonMark/GFM autolink conformance are not included. Malformed HTTP(S) candidates are consumed as literal text to avoid rescanning their suffixes.

This uses the same public `inlineParser` contract as third-party extensions and adds no runtime dependency. Import it only where URL linking is wanted.

## Inline transformation

`transformInline` receives built-in and extension inline nodes after parsing. Return the replacement array. Keep transforms deterministic and avoid repeated full-array scans for every node.

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

An extension is appropriate when syntax is broadly useful to docs, has a deterministic source boundary, and does not justify cost in the core entry. Use a larger processing ecosystem when the job requires async plugins, arbitrary tree pipelines, compiler integration, or MDX evaluation.
