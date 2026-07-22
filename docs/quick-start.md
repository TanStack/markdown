---
title: Quick Start
---

# Quick Start

## Render HTML

```ts
import { renderHtml } from '@tanstack/markdown/html'

const source = `# Release notes

- Small browser bundle
- HTML, React, and Octane renderers
- Safe defaults`

const html = renderHtml(source)
```

`renderHtml` accepts Markdown source or an existing `MarkdownDocument`.

## Render React

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function Article({ source }: { source: string }) {
  return (
    <article>
      <Markdown>{source}</Markdown>
    </article>
  )
}
```

Replace intrinsic elements through `components`:

```tsx
import { Markdown } from '@tanstack/markdown/react'
import { Link } from './Link'

<Markdown components={{ a: Link }}>{source}</Markdown>
```

## Render Octane

```tsrx
import { Markdown } from '@tanstack/markdown/octane'

export function Article({ source }: { source: string }) @{
  <article>
    <Markdown>{source}</Markdown>
  </article>
}
```

Replace host elements with Octane components through the same `components` option.

## Parse once

For build-time content or repeated rendering, parse once and reuse the AST:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderHtml } from '@tanstack/markdown/html'

const document = parseMarkdown(source)
const cached = JSON.stringify(document)
const html = renderHtml(document)
```

```tsx
import { Markdown } from '@tanstack/markdown/react'

<Markdown>{document}</Markdown>
```

The same document can render through Octane:

```ts
import { Markdown as OctaneMarkdown } from '@tanstack/markdown/octane'

const article = OctaneMarkdown({ children: document })
```

## Add heading anchors

Headings receive stable, duplicate-safe IDs by default. Anchor links are opt-in:

```ts
const html = renderHtml(source, {
  headingAnchors: {
    content: '#',
    className: 'heading-anchor',
  },
})
```

## Add docs extensions

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderHtml } from '@tanstack/markdown/html'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const options = {
  extensions: docsMarkdownExtensions(),
}

const document = parseMarkdown(source, options)
const html = renderHtml(document, options)
```

The preset adds callouts, heading collection, and TanStack-style comment components without changing the core entry points. See the [Docs Preset](guides/docs-preset) guide.

## Next steps

- Confirm your content fits the [Syntax Profile](core-concepts/syntax-profile).
- Review the [Security](core-concepts/security) boundary before enabling HTML or highlighting.
- Use the [API Reference](reference/index) for complete options and signatures.
