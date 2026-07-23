---
name: render-markdown
description: >
  Parse Markdown with parseMarkdown or parseInline, render HTML with renderHtml,
  renderDocument, renderBlock, or renderInline, configure frontmatter and
  heading IDs, and reuse the serializable MarkdownDocument AST. Load for
  @tanstack/markdown core syntax, parser options, HTML output, references,
  footnotes, lists, tables, or AST work.
metadata:
  type: core
  library: '@tanstack/markdown'
  library_version: '0.0.10'
sources:
  - 'TanStack/markdown:docs/quick-start.md'
  - 'TanStack/markdown:docs/core-concepts/document-model.md'
  - 'TanStack/markdown:docs/core-concepts/parsing.md'
  - 'TanStack/markdown:docs/core-concepts/rendering.md'
  - 'TanStack/markdown:docs/core-concepts/syntax-profile.md'
  - 'TanStack/markdown:src/parser.ts'
  - 'TanStack/markdown:src/html.ts'
  - 'TanStack/markdown:src/types.ts'
---

# Render Markdown

## Setup

Install the framework-neutral package:

```bash
pnpm add @tanstack/markdown
```

Render supported Markdown to HTML:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const source = `# Release notes

- Small browser bundle
- Serializable AST
- Safe HTML defaults`

const html = renderHtml(source)

console.log(html)
```

Use the narrow `@tanstack/markdown/parser` and
`@tanstack/markdown/html` entry points when the default entry's combined
exports are unnecessary.

## Core Patterns

### Parse once and render a reusable document

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'
import type { MarkdownDocument } from '@tanstack/markdown'

const source = `# Guide

Read the [installation notes](/installation).`

const document = parseMarkdown(source)
const serialized = JSON.stringify(document)
const restored = JSON.parse(serialized) as MarkdownDocument
const html = renderHtml(restored)

console.log(html)
```

All complete-document renderers accept a source string or an existing
`MarkdownDocument`; a document input skips parsing.

### Configure frontmatter and heading IDs while parsing

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const source = `---
title: Installation
published: true
---

# Install

## Install`

const document = parseMarkdown(source, {
  frontmatter: true,
  headingIds(text, lineIndex) {
    const slug = text.toLowerCase().replaceAll(' ', '-')
    return `docs-${lineIndex}-${slug}`
  },
})

console.log(document.frontmatter)
console.log(renderHtml(document))
```

Frontmatter remains an unparsed string. Heading IDs are generated during
parsing and are duplicate-safe under the default slugger.

### Add visible heading anchors while rendering

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const document = parseMarkdown('# API')

const html = renderHtml(document, {
  headingAnchors: {
    content: '#',
    className: 'heading-anchor',
    ariaHidden: true,
    tabIndex: -1,
  },
})

console.log(html)
```

Heading IDs are a parse concern; visible anchor links are a render concern.

### Parse inline content only when no block context is needed

```ts
import { parseInline, renderInline } from '@tanstack/markdown'

const nodes = parseInline('Use **stable** APIs and `parseMarkdown`.')
const html = nodes.map(node => renderInline(node)).join('')

console.log(html)
```

`parseInline` handles inline syntax only. Use `parseMarkdown` for headings,
lists, tables, frontmatter, reference definitions, and footnote definitions.

## Behavioral Contracts

- Parsing is synchronous, deterministic, and normalizes line endings.
- Raw block and inline HTML are recognized only with `allowHtml: true`.
- Link and image URLs have unsafe executable protocols removed.
- Tight lists place simple content directly under `<li>`; loose lists retain
  paragraph wrappers; task checkboxes remain inline with labels.
- Reference definitions resolve case-insensitively before block parsing.
- Footnotes render in first-reference order with collision-safe IDs and
  repeated-reference back links.
- Code fence metadata is recorded in the AST; highlighting is external.
- The AST is public but pre-1.0. Regenerate persisted documents when an
  upgrade changes node contracts.

## Compatibility and Option Timing

TanStack Markdown targets controlled blog and documentation content rather
than complete CommonMark, GFM, MDX, or arbitrary HTML parsing. Before adding
syntax, require corpus evidence, regression coverage, renderer parity, and an
accepted bundle cost. See `production-pipelines/SKILL.md` for compatibility,
security, highlighting, and size gates.

Parsing fixes the document structure. Apply `frontmatter`, `headingIds`,
`allowHtml`, parser state, and parser/transform extensions before caching the
AST. Renderer-only options such as `headingAnchors`, `highlighter`, and
`codeLineNumbers` may be applied when rendering an existing document.

## Common Mistakes

### HIGH Assuming complete CommonMark or GFM behavior

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const markdownFromAnywhere = `Heading
===

Visit https://example.com`

const html = renderHtml(markdownFromAnywhere)

console.log(html)
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const controlledMarkdown = `# Heading

Visit [example](https://example.com)`

const html = renderHtml(controlledMarkdown)

console.log(html)
```

Setext headings and automatic URL linking are outside the supported syntax
profile, so unsupported input can remain literal or have different structure.

Source: `docs/core-concepts/syntax-profile.md`

See also: `production-pipelines/SKILL.md` - compatibility breadth must be
justified against corpus evidence and the bundle budget.

### MEDIUM Reparsing unchanged content on every render

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const source = '# Cached article'

function renderArticle() {
  return renderHtml(source)
}

console.log(renderArticle())
console.log(renderArticle())
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const source = '# Cached article'
const document = parseMarkdown(source)

function renderArticle() {
  return renderHtml(document)
}

console.log(renderArticle())
console.log(renderArticle())
```

Complete-document renderers parse string inputs on every call, while a
`MarkdownDocument` input skips repeated parsing.

Source: `docs/core-concepts/document-model.md`

See also: `production-pipelines/SKILL.md` - parse-ahead caching must preserve
the parser option and extension set.

### HIGH Applying parser options after parsing

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const document = parseMarkdown('# API')
const html = renderHtml(document, { headingIds: false })

console.log(html)
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const document = parseMarkdown('# API', { headingIds: false })
const html = renderHtml(document)

console.log(html)
```

Parse-only options do not retroactively alter a pre-parsed AST.

Source: `docs/reference/html.md`

See also: `custom-extensions/SKILL.md` - parser and transform extensions must
also be present while creating a cached document.

### MEDIUM Using parseInline for document definitions

Wrong:

```ts
import { parseInline, renderInline } from '@tanstack/markdown'

const source = `[Guide][guide]

[guide]: /guide`

const html = parseInline(source).map(node => renderInline(node)).join('')

console.log(html)
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const source = `[Guide][guide]

[guide]: /guide`

const document = parseMarkdown(source)
const html = renderHtml(document)

console.log(html)
```

Standalone inline parsing does not extract document-level reference or
footnote definitions unless internal parser state is supplied explicitly.

Source: `docs/reference/default-entry.md`

## Related Skills

- `production-pipelines/SKILL.md` - trust boundaries, syntax highlighting,
  practical compatibility, caching, tests, performance, and bundle budgets.
- `react-rendering/SKILL.md` - render the same source or AST as React nodes.
- `octane-rendering/SKILL.md` - render the same source or AST as Octane nodes.
- `custom-extensions/SKILL.md` - add deterministic parser and renderer hooks.
- `docs-features/SKILL.md` - use the first-party documentation extensions.

## References

- [AST nodes, parser state, and render options](references/ast-and-options.md)
