---
name: 'react-rendering'
description: >
  Render Markdown source or a MarkdownDocument with @tanstack/markdown/react
  using Markdown, renderMarkdownReact, component replacements, and React static
  SSR. Load for React article components, emitted-tag mappings, pre-parsed
  documents, custom elements, or renderer parity.
metadata:
  type: framework
  library: '@tanstack/markdown'
  framework: 'react'
  library_version: '0.0.10'
requires:
  - 'render-markdown'
sources:
  - 'TanStack/markdown:docs/guides/react.md'
  - 'TanStack/markdown:docs/reference/react.md'
  - 'TanStack/markdown:docs/guides/extensions.md'
  - 'TanStack/markdown:docs/core-concepts/security.md'
  - 'TanStack/markdown:src/react.ts'
  - 'TanStack/markdown:tests/ssr-react.test.tsx'
---

This skill builds on [render-markdown](../render-markdown/SKILL.md). Read it first for the syntax profile, parser options, AST, and core trust boundaries.

# React Rendering

## Setup

Render source directly and keep the surrounding semantic element in the application:

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

`Markdown` returns a React fragment. The React adapter requires React 18 or newer.

## Hooks and Components

### Replace emitted links with an application component

```tsx
import type { ComponentProps } from 'react'
import { Markdown } from '@tanstack/markdown/react'

function ArticleLink(props: ComponentProps<'a'>) {
  const external = props.href?.startsWith('http') ?? false

  return (
    <a
      {...props}
      rel={external ? 'noreferrer' : props.rel}
      target={external ? '_blank' : props.target}
    />
  )
}

export function Article({ source }: { source: string }) {
  return (
    <article>
      <Markdown components={{ a: ArticleLink }}>{source}</Markdown>
    </article>
  )
}
```

`components` is keyed by emitted intrinsic or custom-element tag names.

### Parse once before repeated React rendering

```tsx
import { parseMarkdown } from '@tanstack/markdown/parser'
import { Markdown } from '@tanstack/markdown/react'

const document = parseMarkdown('# Cached article\n\nRendered from an AST.')

export function Article() {
  return (
    <article>
      <Markdown>{document}</Markdown>
    </article>
  )
}
```

Apply parser options and document transforms when creating the document; renderer options cannot retroactively change its structure.

### Render static React markup on the server

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { Markdown } from '@tanstack/markdown/react'

const source = '# Server-rendered article'

export const html = renderToStaticMarkup(
  <article>
    <Markdown>{source}</Markdown>
  </article>,
)
```

Core static output is tested for structural equivalence with `renderHtml()`.

### Compose through the lower-level node API

```tsx
import type { ReactNode } from 'react'
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderMarkdownReact } from '@tanstack/markdown/react'

const document = parseMarkdown('# Parsed once')

export function ArticleBody(): ReactNode {
  return renderMarkdownReact(document)
}
```

Use `renderBlockReact` or `renderInlineReact` only when custom tree composition needs individual public AST nodes.

## Common Mistakes

### HIGH Injecting HTML instead of React nodes

Wrong:

```tsx
import { renderHtml } from '@tanstack/markdown'

export function Article({ source }: { source: string }) {
  const html = renderHtml(source)
  return <article dangerouslySetInnerHTML={{ __html: html }} />
}
```

Correct:

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

The HTML-string path bypasses React component replacement and creates an unnecessary trusted-HTML boundary.

Source: `docs/guides/react.md`

### HIGH Mapping AST node names instead of tags

Wrong:

```tsx
import type { ComponentProps } from 'react'
import { Markdown } from '@tanstack/markdown/react'

function ArticleLink(props: ComponentProps<'a'>) {
  return <a {...props} data-navigation="article" />
}

export function Article() {
  return (
    <Markdown components={{ link: ArticleLink }}>
      {'Read the [guide](/guide).'}
    </Markdown>
  )
}
```

Correct:

```tsx
import type { ComponentProps } from 'react'
import { Markdown } from '@tanstack/markdown/react'

function ArticleLink(props: ComponentProps<'a'>) {
  return <a {...props} data-navigation="article" />
}

export function Article() {
  return (
    <Markdown components={{ a: ArticleLink }}>
      {'Read the [guide](/guide).'}
    </Markdown>
  )
}
```

The map is keyed by emitted tag names such as `a`, not AST discriminants such as `link`.

Source: `docs/guides/react.md`

### HIGH Expecting HTML extension hooks in React

Wrong:

```tsx
import type { MarkdownExtension } from '@tanstack/markdown'
import { Markdown } from '@tanstack/markdown/react'

const paragraphHtml: MarkdownExtension = {
  name: 'paragraph-html',
  renderHtml(node) {
    return node.type === 'paragraph'
      ? '<aside>Rendered only by the HTML renderer</aside>'
      : undefined
  },
}

export function Article() {
  return <Markdown extensions={[paragraphHtml]}>Ordinary content</Markdown>
}
```

Correct:

```tsx
import type { MarkdownExtension } from '@tanstack/markdown'
import type { PropsWithChildren } from 'react'
import { Markdown } from '@tanstack/markdown/react'

const panelExtension: MarkdownExtension = {
  name: 'panel',
  transformDocument(document) {
    return {
      ...document,
      children: [
        {
          type: 'component',
          name: 'panel',
          tagName: 'doc-panel',
          attributes: {},
          children: document.children,
        },
      ],
    }
  },
}

function Panel({ children }: PropsWithChildren) {
  return <aside className="documentation-panel">{children}</aside>
}

export function Article() {
  return (
    <Markdown
      components={{ 'doc-panel': Panel }}
      extensions={[panelExtension]}
    >
      Ordinary content
    </Markdown>
  )
}
```

`MarkdownExtension.renderHtml` is HTML-specific; portable custom output uses `ComponentNode` and an emitted-tag component mapping.

Source: `docs/guides/extensions.md`

### CRITICAL Enabling raw HTML for untrusted input

Wrong:

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function UserPost({ source }: { source: string }) {
  return <Markdown allowHtml>{source}</Markdown>
}
```

Correct:

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function UserPost({ source }: { source: string }) {
  return <Markdown>{source}</Markdown>
}
```

With `allowHtml`, React uses `dangerouslySetInnerHTML`; TanStack Markdown does not sanitize that raw HTML.

Source: `docs/core-concepts/security.md`

### HIGH Tension: renderer parity versus React customization

Core React SSR is tested against `renderHtml()`. React component replacements, raw HTML, highlighter output, and HTML-only extension hooks are application-controlled boundaries outside that parity guarantee.

See also: [custom-extensions](../custom-extensions/SKILL.md) for portable `ComponentNode` output.

## Cross-References

- [render-markdown](../render-markdown/SKILL.md) - shared `MarkdownInput`, parser options, AST behavior, and syntax profile.
- [custom-extensions](../custom-extensions/SKILL.md) - emit custom tags that React can replace through `components`.
- [production-pipelines](../production-pipelines/SKILL.md) - audit raw HTML, highlighter output, untrusted content, and SSR boundaries.
