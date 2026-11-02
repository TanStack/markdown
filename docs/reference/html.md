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
| `codeLineNumbers` | unset | Forward the preference and add `tm-code--line-numbers` when true |
| `headingAnchors` | `false` | Append default or configured links to headings with IDs |

When rendering a pre-parsed document, parse-only options do not retroactively change its AST. Renderer options and extension `renderHtml` hooks still apply.

## `createStreamingHtmlRenderer` and `StreamingHtmlRenderer`

The optional `@tanstack/markdown/html/streaming` entry exports a factory and its session type:

```ts
import {
  createStreamingHtmlRenderer,
  type StreamingHtmlRenderer,
} from '@tanstack/markdown/html/streaming'

const renderer: StreamingHtmlRenderer = createStreamingHtmlRenderer()
const html = renderer.render(accumulatedResponse)
renderer.reset()
```

`render(input: MarkdownInput, options?: RenderOptions): string` returns complete HTML with the streaming extension enabled. Pass the whole accumulated source on each update. Edits and document inputs are supported. Custom extensions run after the built-in streaming extension.

The session reuses escaped HTML while appending to a standalone, unindented open code fence with LF line endings and no possible closing-fence line. Other inputs use the full renderer. It keeps the current source and HTML, so call `reset(): void` when discarding a response. This clears cached text without changing extension configuration.

Supplying an options object disables caching for the rest of that session, including after reset. Extension hooks can retain and mutate the built-in extension, so later calls continue through the full pipeline to honor those mutations. Create a fresh session to use caching again. Options, highlighters, escaping and URL safety follow `renderHtml`.
