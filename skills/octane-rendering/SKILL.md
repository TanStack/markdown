---
name: 'octane-rendering'
description: >
  Render Markdown source or a MarkdownDocument with @tanstack/markdown/octane
  using Markdown, renderMarkdownOctane, ComponentBody replacements, TSRX, and
  octane/server static SSR. Load for Octane descriptors, custom emitted tags,
  pre-parsed documents, SSR return values, or renderer parity.
metadata:
  type: framework
  library: '@tanstack/markdown'
  framework: 'octane'
  library_version: '0.0.10'
requires:
  - 'render-markdown'
sources:
  - 'TanStack/markdown:docs/guides/octane.md'
  - 'TanStack/markdown:docs/reference/octane.md'
  - 'TanStack/markdown:docs/guides/extensions.md'
  - 'TanStack/markdown:docs/core-concepts/security.md'
  - 'TanStack/markdown:src/octane.ts'
  - 'TanStack/markdown:tests/ssr-octane.test.ts'
---

This skill builds on [render-markdown](../render-markdown/SKILL.md). Read it first for the syntax profile, parser options, AST, and core trust boundaries.

# Octane Rendering

## Setup

Install the optional Octane peer and render a fragment descriptor:

```bash
pnpm add @tanstack/markdown octane
```

```ts
import { createElement } from 'octane'
import { Markdown } from '@tanstack/markdown/octane'

export function Article({ source }: { source: string }) {
  return createElement(
    'article',
    null,
    Markdown({
      children: source,
    }),
  )
}
```

The adapter requires `octane@0.1.12` or newer. `Markdown` returns an `ElementDescriptor`, not an HTML string.

## Hooks and Components

### Render Markdown from TSRX

```tsrx
import { Markdown } from '@tanstack/markdown/octane'

export function Article({ source }: { source: string }) @{
  <article>
    <Markdown>{source}</Markdown>
  </article>
}
```

The component returns an Octane fragment descriptor, so the application owns the surrounding semantic element.

### Replace emitted links with an Octane component

```ts
import { createElement, type ComponentBody } from 'octane'
import { Markdown } from '@tanstack/markdown/octane'

const ArticleLink: ComponentBody<any> = props => {
  const external =
    typeof props.href === 'string' && props.href.startsWith('http')

  return createElement('a', {
    ...props,
    rel: external ? 'noreferrer' : props.rel,
    target: external ? '_blank' : props.target,
  })
}

export function Article({ source }: { source: string }) {
  return Markdown({
    children: source,
    components: { a: ArticleLink },
  })
}
```

`components` accepts host tag strings or Octane `ComponentBody` values keyed by emitted tag name.

### Render static markup and styles

```ts
import { renderToStaticMarkup } from 'octane/server'
import { Markdown } from '@tanstack/markdown/octane'

const source = '# Server-rendered article'

export const { html, css } = renderToStaticMarkup(Markdown, {
  children: source,
})
```

`octane/server` returns an object containing both `html` and `css`.

### Parse once before repeated Octane rendering

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { Markdown } from '@tanstack/markdown/octane'

const document = parseMarkdown('# Cached article\n\nRendered from an AST.')

export const article = Markdown({
  children: document,
})
```

Apply parser options and document transforms before caching the document.

### Compose through the lower-level node API

```ts
import { Fragment, createElement } from 'octane'
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderMarkdownOctane } from '@tanstack/markdown/octane'

const document = parseMarkdown('# Parsed once')

export function ArticleBody() {
  return createElement(
    Fragment,
    null,
    ...renderMarkdownOctane(document),
  )
}
```

Use `renderBlockOctane` or `renderInlineOctane` only when custom tree composition needs individual public AST nodes.

## Common Mistakes

### HIGH Treating descriptors as HTML strings

Wrong:

```ts
import { Markdown } from '@tanstack/markdown/octane'

const source = '# Article'

export const html = String(Markdown({ children: source }))
```

Correct:

```ts
import { renderToStaticMarkup } from 'octane/server'
import { Markdown } from '@tanstack/markdown/octane'

const source = '# Article'

export const { html } = renderToStaticMarkup(Markdown, {
  children: source,
})
```

`Markdown` returns an `ElementDescriptor`; serialize it through `octane/server` when an HTML string is required.

Source: `docs/reference/octane.md`

### HIGH Using a React component in the map

Wrong:

```tsx
import type { ComponentProps } from 'react'
import { Markdown } from '@tanstack/markdown/octane'

function ReactLink(props: ComponentProps<'a'>) {
  return <a {...props} />
}

export const article = Markdown({
  children: '[Guide](/guide)',
  components: { a: ReactLink },
})
```

Correct:

```ts
import { createElement, type ComponentBody } from 'octane'
import { Markdown } from '@tanstack/markdown/octane'

const OctaneLink: ComponentBody<any> = props =>
  createElement('a', {
    ...props,
    'data-navigation': 'article',
  })

export const article = Markdown({
  children: '[Guide](/guide)',
  components: { a: OctaneLink },
})
```

Octane replacements must be host tag strings or Octane `ComponentBody` values.

Source: `docs/guides/octane.md`

### MEDIUM Ignoring the static-render return structure

Wrong:

```ts
import { renderToStaticMarkup } from 'octane/server'
import { Markdown } from '@tanstack/markdown/octane'

export const markup = renderToStaticMarkup(Markdown, {
  children: '# Article',
})
```

Correct:

```ts
import { renderToStaticMarkup } from 'octane/server'
import { Markdown } from '@tanstack/markdown/octane'

export const { html, css } = renderToStaticMarkup(Markdown, {
  children: '# Article',
})
```

The static renderer returns `{ html, css }`, not a bare HTML string.

Source: `docs/guides/octane.md`

### HIGH Expecting HTML extension hooks in Octane

Wrong:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { Markdown } from '@tanstack/markdown/octane'

const paragraphHtml: MarkdownExtension = {
  name: 'paragraph-html',
  renderHtml(node) {
    return node.type === 'paragraph'
      ? '<aside>Rendered only by the HTML renderer</aside>'
      : undefined
  },
}

export const article = Markdown({
  children: 'Ordinary content',
  extensions: [paragraphHtml],
})
```

Correct:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { createElement, type ComponentBody } from 'octane'
import { Markdown } from '@tanstack/markdown/octane'

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

const Panel: ComponentBody<any> = props =>
  createElement('aside', {
    ...props,
    className: 'documentation-panel',
  })

export const article = Markdown({
  children: 'Ordinary content',
  components: { 'doc-panel': Panel },
  extensions: [panelExtension],
})
```

`MarkdownExtension.renderHtml` is HTML-specific; portable custom output uses `ComponentNode` and an emitted-tag component mapping.

Source: `docs/guides/extensions.md`

### CRITICAL Enabling raw HTML for untrusted input

Wrong:

```ts
import { Markdown } from '@tanstack/markdown/octane'

export function UserPost({ source }: { source: string }) {
  return Markdown({
    allowHtml: true,
    children: source,
  })
}
```

Correct:

```ts
import { Markdown } from '@tanstack/markdown/octane'

export function UserPost({ source }: { source: string }) {
  return Markdown({
    children: source,
  })
}
```

With `allowHtml`, Octane receives `dangerouslySetInnerHTML`; TanStack Markdown does not sanitize that raw HTML.

Source: `docs/core-concepts/security.md`

### HIGH Tension: renderer parity versus Octane customization

Core Octane static output is tested against `renderHtml()`. Octane component replacements, raw HTML, highlighter output, and HTML-only extension hooks are application-controlled boundaries outside that parity guarantee.

See also: [custom-extensions](../custom-extensions/SKILL.md) for portable `ComponentNode` output.

## Cross-References

- [render-markdown](../render-markdown/SKILL.md) - shared `MarkdownInput`, parser options, AST behavior, and syntax profile.
- [custom-extensions](../custom-extensions/SKILL.md) - emit custom tags that Octane can replace through `components`.
- [production-pipelines](../production-pipelines/SKILL.md) - audit raw HTML, highlighter output, untrusted content, and static SSR boundaries.
