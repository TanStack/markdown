---
title: Octane
---

# Octane

The Octane adapter renders Markdown source or a pre-parsed document directly to Octane element descriptors. It imports only the Octane runtime and does not produce an intermediate HTML string.

## Installation

```bash
pnpm add @tanstack/markdown octane
```

The adapter requires `octane@0.1.12` or newer. Octane is an optional peer dependency and is not imported by any other package entry.

## Component usage

```tsrx
import { Markdown } from '@tanstack/markdown/octane'

export function Article({ source }: { source: string }) @{
  <article>
    <Markdown>{source}</Markdown>
  </article>
}
```

`Markdown` returns an Octane fragment descriptor, so the surrounding semantic element remains under application control.

## Replace intrinsic elements

Map an emitted tag name to an Octane component or another host tag:

```ts
import { createElement, type ComponentBody } from 'octane'
import { Markdown } from '@tanstack/markdown/octane'

const ExternalLink: ComponentBody<any> = props =>
  createElement('a', {
    ...props,
    rel: 'noreferrer',
    target: '_blank',
  })

const article = Markdown({
  children: source,
  components: { a: ExternalLink },
})
```

Mappings apply to intrinsic tags and custom element names emitted by docs extensions.

## Static SSR

```ts
import { renderToStaticMarkup } from 'octane/server'
import { Markdown } from '@tanstack/markdown/octane'

const { html, css } = renderToStaticMarkup(Markdown, {
  children: source,
})
```

Core Octane SSR output is tested for structural parity with `renderHtml()`, including tight and loose lists, tables, footnotes, docs extensions, and highlighted code.

## Parse once

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { Markdown } from '@tanstack/markdown/octane'

const document = parseMarkdown(source)
const article = Markdown({ children: document })
```

Use `renderMarkdownOctane`, `renderBlockOctane`, and `renderInlineOctane` when composing descriptors outside the component API.

## Trusted boundaries

Raw HTML uses Octane's `dangerouslySetInnerHTML` contract when `allowHtml` is enabled. Highlighter output uses the same path inside `<code>`. Keep both disabled for untrusted content unless the output is sanitized by the application.
