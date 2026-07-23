---
name: 'docs-features'
description: >
  Build documentation metadata with docsMarkdownExtensions, GitHub-style
  callouts, heading collection, comment components, heading/file/package-
  manager/bundler tabs, framework panels, and code-fence metadata. Load when
  authoring or consuming TanStack-style docs syntax and custom-element data
  contracts.
metadata:
  type: core
  library: '@tanstack/markdown'
  library_version: '0.0.10'
requires:
  - 'render-markdown'
sources:
  - 'TanStack/markdown:docs/guides/docs-preset.md'
  - 'TanStack/markdown:docs/reference/extensions.md'
  - 'TanStack/markdown:src/extensions/docs.ts'
  - 'TanStack/markdown:src/extensions/tabs.ts'
  - 'TanStack/markdown:src/extensions/framework.ts'
  - 'TanStack/markdown:src/extensions/headings.ts'
  - 'TanStack/markdown:src/extensions/comment-components.ts'
---

This skill builds on [render-markdown](../render-markdown/SKILL.md). Read it first for parser options, AST reuse, rendering, and core trust boundaries.

# Docs Features

## Setup

Create one extension array and use it for parsing and rendering:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `# Deployment

> [!TIP] Parse once
> Reuse the document for every renderer.

## Install

Run the package-manager command for your application.`

const extensions = docsMarkdownExtensions()
const document = parseMarkdown(source, { extensions })

export const headings = document.headings
export const html = renderHtml(document, {
  extensions,
  headingAnchors: true,
})
```

The preset composes callouts, transformed comment components, and heading collection. It emits metadata and custom elements; it does not install documentation UI behavior.

## Core Patterns

### Collect headings without selector headings

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `# Guide

<!-- ::start:tabs -->

## React

React setup

## Solid

Solid setup

<!-- ::end:tabs -->

## API`

const extensions = docsMarkdownExtensions()

export const document = parseMarkdown(source, { extensions })
export const headings = document.headings
```

Heading collection defaults to skipping every heading inside a component named `tabs`. Pass `docsMarkdownExtensions({ collectHeadings: false })` to disable collection or an options object with `skipComponentNames` to replace the default skip set.

### Author each tab input shape

Heading tabs split at the shallowest heading:

```md
<!-- ::start:tabs -->

## React

React setup

## Solid

Solid setup

<!-- ::end:tabs -->
```

File tabs select fenced code blocks and use `title=` or `file=` as labels:

````md
<!-- ::start:tabs variant="files" -->

```tsx file="app.tsx"
export function App() {
  return <main>Docs</main>
}
```

```css file="app.css"
main {
  display: block;
}
```

<!-- ::end:tabs -->
````

Package-manager tabs consume `framework: package...` lines and remove their source children after creating metadata:

```md
<!-- ::start:tabs variant="package-manager" mode="dev-install" -->

react: @tanstack/react-query @tanstack/react-router
solid: @tanstack/solid-query @tanstack/solid-router

<!-- ::end:tabs -->
```

Bundler tabs accept only Vite and Rsbuild heading sections:

````md
<!-- ::start:tabs variant="bundler" -->

## Vite

```ts
export default { plugins: [] }
```

## Rsbuild

```ts
export default { plugins: [] }
```

<!-- ::end:tabs -->
````

Every transform returns the original component unchanged when its required structure is absent. See [docs metadata contracts](references/docs-metadata.md) for exact properties and fallback rules.

### Build framework-specific panels

```md
<!-- ::start:framework -->

# React

## Install

```tsx title="react.tsx"
export const framework = 'react'
```

# Solid

## Install

```tsx title="solid.tsx"
export const framework = 'solid'
```

<!-- ::end:framework -->
```

Framework blocks require level-one selector headings. They emit `md-framework-panel` children, lowercase framework names, label nested headings, and expose code-block metadata by framework.

### Read component metadata before rendering

```ts
import type { ComponentNode } from '@tanstack/markdown'
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

interface TabDescriptor {
  slug: string
  name: string
}

function isTabsNode(node: unknown): node is ComponentNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    node.type === 'component' &&
    'name' in node &&
    node.name === 'tabs'
  )
}

const source = `<!-- ::start:tabs -->

## React

React content

## Solid

Solid content

<!-- ::end:tabs -->`

const document = parseMarkdown(source, {
  extensions: docsMarkdownExtensions(),
})
const tabsNode = document.children.find(isTabsNode)
const metadata = tabsNode?.properties?.['data-attributes']

export const tabs: TabDescriptor[] = metadata
  ? (JSON.parse(metadata) as { tabs: TabDescriptor[] }).tabs
  : []
```

`ComponentNode.properties` holds strings. JSON-bearing values are serialized into escaped HTML attributes by the HTML renderer and must be parsed by the consuming application.

## Common Mistakes

### HIGH Assuming transformed tabs are interactive

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `<!-- ::start:tabs -->

## React

React content

<!-- ::end:tabs -->`

export const interactiveTabs = renderHtml(source, {
  extensions: docsMarkdownExtensions(),
})
```

Correct:

```ts
import type { ComponentNode } from '@tanstack/markdown'
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `<!-- ::start:tabs -->

## React

React content

<!-- ::end:tabs -->`

const document = parseMarkdown(source, {
  extensions: docsMarkdownExtensions(),
})
const tabsNode = document.children.find(
  (node): node is ComponentNode =>
    node.type === 'component' && node.name === 'tabs',
)

export const tabPanels =
  tabsNode?.children.filter(
    (node): node is ComponentNode =>
      node.type === 'component' && node.tagName === 'md-tab-panel',
  ) ?? []
```

The transform supplies a model and custom-element names; the site must bind those values to its own state, controls, and renderer components.

Source: `docs/guides/docs-preset.md`

### HIGH Leaving a component block unmatched

Wrong:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `<!-- ::start:tabs -->

## React

React content`

export const document = parseMarkdown(source, {
  extensions: docsMarkdownExtensions(),
})
```

Correct:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `<!-- ::start:tabs -->

## React

React content

<!-- ::end:tabs -->`

export const document = parseMarkdown(source, {
  extensions: docsMarkdownExtensions(),
})
```

An unmatched start is consumed as an empty component, while the following body remains ordinary Markdown.

Source: `src/extensions/comment-components.ts:41-63`

### MEDIUM Passing the wrong tab content shape

Wrong:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `<!-- ::start:tabs variant="files" -->

This variant does not turn prose into a file.

<!-- ::end:tabs -->`

export const document = parseMarkdown(source, {
  extensions: docsMarkdownExtensions(),
})
```

Correct:

````ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const source = `<!-- ::start:tabs variant="files" -->

\`\`\`ts file="app.ts"
export const app = true
\`\`\`

<!-- ::end:tabs -->`

export const document = parseMarkdown(source, {
  extensions: docsMarkdownExtensions(),
})
````

The file transform silently returns the original component when it finds no direct code-block children; the other variants have similarly specific input contracts.

Source: `src/extensions/tabs.ts:16-18`

### MEDIUM Expecting fence metadata to highlight code

Wrong:

````ts
import { renderHtml } from '@tanstack/markdown/html'

const source = `\`\`\`ts file="app.ts" {2}
const one = 1
const two = 2
\`\`\``

export const html = renderHtml(source)
````

Correct:

````ts
import {
  renderNodesToHtml,
  renderTokens,
  tokenize,
} from '@tanstack/highlight'
import { renderHtml } from '@tanstack/markdown/html'

const source = `\`\`\`ts file="app.ts" {2}
const one = 1
const two = 2
\`\`\``

export const html = renderHtml(source, {
  highlighter(code, lang, options) {
    const result = tokenize(code, { lang })
    return renderNodesToHtml(
      renderTokens(result.tokens, {
        decorations: options?.highlightLines?.map((line) => ({
          lines: line,
          className: 'is-highlighted',
        })),
      }),
    )
  },
})
````

Fence metadata populates the AST and highlighter options, but tokenization, themes, and CSS stay outside this package.

Source: `docs/core-concepts/syntax-profile.md`

## Boundaries

- Docs transforms enrich trusted repository-authored content but do not execute MDX, JSX, or JavaScript expressions.
- Highlighter output is trusted HTML. Keep highlighting at build time or on the server and apply the checks in [production-pipelines](../production-pipelines/SKILL.md).
- Import individual extension entry points when the complete preset adds unused behavior or bundle cost.
- Use [custom-extensions](../custom-extensions/SKILL.md) when built-in comment components or transforms do not express the required deterministic syntax.
- Use the React or Octane renderer skill to map emitted tags such as `md-tab-panel` and `md-framework-panel` to framework components.

## References

- [Docs metadata contracts](references/docs-metadata.md)
