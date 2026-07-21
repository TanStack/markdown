---
title: HTML
---

# HTML

The `@tanstack/markdown/html` entry exports the HTML renderer without React.

```ts
import {
  renderBlock,
  renderDocument,
  renderHtml,
  renderInline,
} from '@tanstack/markdown/html'
```

## `renderHtml`

```ts
function renderHtml(
  input: MarkdownInput,
  options?: RenderOptions,
): string
```

Parses string input when necessary and renders all document children joined by newlines.

## `renderDocument`

```ts
function renderDocument(
  document: MarkdownDocument,
  options?: RenderOptions,
): string
```

Renders an existing document. This is an alias with a narrower input type.

## `renderBlock`

```ts
function renderBlock(
  node: BlockNode,
  options?: RenderOptions,
): string
```

Runs extension HTML hooks, then renders one block node.

## `renderInline`

```ts
function renderInline(
  node: InlineNode,
  options?: RenderOptions,
): string
```

Runs extension HTML hooks, then renders one inline node.

## Render options

`RenderOptions` includes every `ParseOptions` field plus:

| Option | Default | Behavior |
| --- | --- | --- |
| `highlighter` | none | Return trusted HTML for code contents |
| `codeLineNumbers` | unset | Forward the line-number preference to the highlighter |
| `headingAnchors` | `false` | Append default or configured links to headings with IDs |

When rendering a pre-parsed document, parse-only options do not retroactively change its AST. Renderer options and extension `renderHtml` hooks still apply.
