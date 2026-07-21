---
title: Rendering
---

# Rendering

TanStack Markdown provides HTML and React renderers over the same AST.

```ts
import { renderHtml } from '@tanstack/markdown/html'

const html = renderHtml(source)
```

```tsx
import { Markdown } from '@tanstack/markdown/react'

const article = <Markdown>{source}</Markdown>
```

## Core parity

Core syntax is tested so server-rendered React markup and `renderHtml` have equivalent structure. Formatting differences that React controls, such as boolean attribute serialization and whitespace between block elements, are normalized in parity tests.

Renderer-specific boundaries are excluded from this guarantee:

- React `components` replacements
- extension `renderHtml` hooks
- trusted raw HTML injection
- highlighter output

## Lists

Tight lists render paragraph content directly under `<li>`. Loose lists preserve `<p>` wrappers. Task-list checkboxes stay inline with their labels in either form.

## Code blocks

Without a highlighter, code is escaped and rendered as a small `<pre><code>` tree. A titled fence adds a `<figure>` and `<figcaption>`. The renderer records language, filename, framework, and line metadata as classes and data attributes.

With a `highlighter` callback, the returned HTML becomes the contents of `<code>`. The callback is a trusted boundary.

## Heading anchors

Heading IDs are a parse concern. Visible anchor links are a render concern and are disabled by default:

```ts
renderHtml(document, {
  headingAnchors: {
    content: '#',
    className: 'heading-anchor',
    ariaHidden: true,
    tabIndex: -1,
  },
})
```

## Rendering individual nodes

`renderBlock` and `renderInline` render one AST node. `renderDocument` is the document-specific alias of `renderHtml`. React exposes corresponding `renderBlockReact`, `renderInlineReact`, and `renderMarkdownReact` functions.
