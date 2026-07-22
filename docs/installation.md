---
title: Installation
---

# Installation

Install the package with pnpm:

```bash
pnpm add @tanstack/markdown
```

## HTML and parser usage

The parser and HTML renderer have no peer dependencies:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const html = renderHtml('# Hello')
```

Use the narrowest entry point your application needs:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderHtml } from '@tanstack/markdown/html'
```

The default `@tanstack/markdown` entry re-exports the parser, HTML renderer, inline parser, and all public types.

## React usage

The React adapter requires React 18 or newer:

```bash
pnpm add @tanstack/markdown react
```

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function Article({ source }: { source: string }) {
  return <Markdown>{source}</Markdown>
}
```

React is a peer dependency and is not bundled into the adapter.

## Octane usage

The Octane adapter requires Octane 0.1.12 or newer:

```bash
pnpm add @tanstack/markdown octane
```

```tsrx
import { Markdown } from '@tanstack/markdown/octane'

export function Article({ source }: { source: string }) @{
  <Markdown>{source}</Markdown>
}
```

Octane is an optional peer dependency and is not bundled into the adapter.

## Runtime and module format

TanStack Markdown ships ESM JavaScript and TypeScript declarations. Its synchronous core works in modern browsers, server runtimes, build tools, React server rendering, and Octane server rendering.

## Optional capabilities

Syntax highlighting is supplied as a callback, so install only the highlighter your application uses. Docs-specific behavior is available through separately importable [extensions](guides/extensions).
