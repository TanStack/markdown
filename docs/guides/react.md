---
title: React
---

# React

The React adapter renders Markdown source or a pre-parsed document without an intermediate HTML string.

## Component usage

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function Article({ source }: { source: string }) {
  return <Markdown>{source}</Markdown>
}
```

`Markdown` returns a fragment, so the surrounding semantic element remains under application control.

## Replace intrinsic elements

Map an HTML tag name to a component or another tag:

```tsx
import {
  Markdown,
  type MarkdownComponents,
} from '@tanstack/markdown/react'

const components = {
  a(props) {
    const hasProtocol = /^[a-z][a-z0-9+.-]*:/i.test(props.href || '')
    const allowed =
      !hasProtocol || /^(https?:|mailto:)/i.test(props.href || '')
    const href = allowed ? props.href : undefined
    const external = /^https?:\/\//i.test(href || '')

    return (
      <a
        {...props}
        href={href}
        rel={external ? 'nofollow noopener noreferrer' : props.rel}
        target={external ? '_blank' : props.target}
      />
    )
  },
  img({ alt }) {
    return <span role="img">Image: {alt || 'No description'}</span>
  },
} satisfies MarkdownComponents

<Markdown components={components}>{source}</Markdown>
```

Known intrinsic keys receive their matching React props by inference, so `a` exposes anchor props and `img` exposes image props. Arbitrary extension component tag names remain supported. Mappings apply to every intrinsic tag emitted through the React renderer.

## Pre-parse for SSR

```tsx
import { parseMarkdown } from '@tanstack/markdown/parser'
import { Markdown } from '@tanstack/markdown/react'

const document = parseMarkdown(source)

export function Article() {
  return <Markdown>{document}</Markdown>
}
```

The AST contains no functions, classes, or environment-specific values. It can be built ahead of time or loaded from a content cache.

## Lower-level rendering

Use `renderMarkdownReact` outside JSX, or `renderBlockReact` and `renderInlineReact` when composing a custom renderer around the standard nodes.

## Parity and keys

The adapter generates deterministic keys from tree positions. Core SSR output is tested against the HTML renderer. Custom components, raw HTML, highlighter output, and HTML-only extension hooks are application-controlled boundaries and are not covered by that equivalence guarantee.
