---
name: 'custom-extensions'
description: >
  Implement MarkdownExtension block parsers, inline and document transforms,
  HTML hooks, and portable ComponentNode output. Load when adding deterministic
  custom syntax or rendering behavior across HTML, React, and Octane.
metadata:
  type: core
  library: '@tanstack/markdown'
  library_version: '0.0.10'
requires:
  - 'render-markdown'
sources:
  - 'TanStack/markdown:docs/guides/extensions.md'
  - 'TanStack/markdown:docs/reference/extensions.md'
  - 'TanStack/markdown:src/types.ts'
  - 'TanStack/markdown:src/parser.ts'
  - 'TanStack/markdown:src/extensions/callouts.ts'
  - 'TanStack/markdown:src/extensions/comment-components.ts'
---

This skill builds on `render-markdown`. Read it first for parser options, the document AST, and renderer behavior.

# Custom Extensions

## Setup

Implement a bounded block parser and return a standard `ComponentNode`:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

function notesExtension(): MarkdownExtension {
  return {
    name: 'notes',
    parseBlock(context) {
      const first = context.lines[context.index] ?? ''
      const opening = first.match(/^:::note(?:\s+(.*))?$/)
      if (!opening) return undefined

      const body: string[] = []
      let cursor = context.index + 1
      while (cursor < context.lines.length && context.lines[cursor] !== ':::') {
        body.push(context.lines[cursor] ?? '')
        cursor++
      }
      if (context.lines[cursor] !== ':::') return undefined

      const title = opening[1]?.trim() || 'Note'
      context.consume(cursor - context.index + 1)
      return {
        type: 'component',
        name: 'note',
        tagName: 'docs-note',
        attributes: { title },
        properties: { 'data-title': title },
        children: context.parseBlocks(body.join('\n')),
      }
    },
  }
}

const source = `:::note Cache the AST
Parse once and render many times.
:::`
const extensions = [notesExtension()]
const document = parseMarkdown(source, { extensions })
const html = renderHtml(document, { extensions })

console.log(html)
```

`parseBlock` runs before built-in block parsing, and nested `parseBlocks` shares the parent depth budget and heading slugger.

## Core Patterns

### Transform parsed inline nodes

```ts
import type {
  InlineNode,
  MarkdownExtension,
  StrongNode,
} from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'

const importantExtension: MarkdownExtension = {
  name: 'important-inline',
  transformInline(nodes) {
    return nodes.map((node): InlineNode => {
      if (node.type !== 'text' || !node.value.startsWith('IMPORTANT: ')) {
        return node
      }
      const strong: StrongNode = {
        type: 'strong',
        children: [{ type: 'text', value: node.value }],
      }
      return strong
    })
  },
}

const html = renderHtml('IMPORTANT: Back up the database.', {
  extensions: [importantExtension],
})

console.log(html)
```

Transforms receive built-in inline nodes and must return a deterministic replacement array.

### Derive document metadata after parsing

```ts
import type {
  InlineNode,
  MarkdownExtension,
  MarkdownHeading,
} from '@tanstack/markdown'
import { parseMarkdown } from '@tanstack/markdown/parser'

function inlineText(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === 'text' || node.type === 'inlineCode') return node.value
      if (node.type === 'image') return node.alt
      if ('children' in node) return inlineText(node.children)
      return ''
    })
    .join('')
}

const topLevelHeadings: MarkdownExtension = {
  name: 'top-level-headings',
  transformDocument(document) {
    const headings: MarkdownHeading[] = document.children.flatMap((node) =>
      node.type === 'heading' && node.id
        ? [{
            id: node.id,
            text: inlineText(node.children),
            level: node.depth,
          }]
        : [],
    )
    return { ...document, headings }
  },
}

const document = parseMarkdown('# Install\n\n## Configure', {
  extensions: [topLevelHeadings],
})

console.log(document.headings)
```

Document transforms run after blocks and footnotes are complete and may return a new document or mutate the existing one.

### Use an HTML hook only for HTML output

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { calloutsExtension } from '@tanstack/markdown/extensions/callouts'
import { renderHtml } from '@tanstack/markdown/html'

const compactCalloutHtml: MarkdownExtension = {
  name: 'compact-callout-html',
  renderHtml(node, context) {
    if (node.type !== 'callout') return undefined
    const children = node.children.map(context.renderBlock).join('\n')
    return `<aside class="compact-callout">${children}</aside>`
  },
}

const extensions = [calloutsExtension(), compactCalloutHtml]
const html = renderHtml('> [!NOTE]\n> Cached.', { extensions })

console.log(html)
```

The returned string is trusted and HTML-specific; nested standard nodes remain escaped because they use `context.renderBlock`.

### Emit portable custom elements

```ts
import { commentComponentsExtension } from '@tanstack/markdown/extensions/comment-components'
import { renderHtml } from '@tanstack/markdown/html'

const panels = commentComponentsExtension({
  transformComponent(node) {
    if (node.name !== 'panel') return node
    return {
      ...node,
      tagName: 'docs-panel',
      properties: {
        'data-kind': node.attributes.kind ?? 'note',
      },
    }
  },
})

const source = `<!-- ::start:panel kind="warning" -->
Check the migration before deploying.
<!-- ::end:panel -->`
const html = renderHtml(source, { extensions: [panels] })

console.log(html)
```

React and Octane can replace the emitted `docs-panel` tag through their `components` maps.

## Common Mistakes

### HIGH Claiming a block without consuming it

Wrong:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'

const brokenNotes: MarkdownExtension = {
  name: 'broken-notes',
  parseBlock(context) {
    if (context.lines[context.index] !== ':::note') return undefined
    return {
      type: 'paragraph',
      children: context.parseInline(context.lines[context.index + 1] ?? ''),
    }
  },
}

console.log(renderHtml(':::note\nCached.\n:::', {
  extensions: [brokenNotes],
}))
```

Correct:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'

const notes: MarkdownExtension = {
  name: 'notes',
  parseBlock(context) {
    if (context.lines[context.index] !== ':::note') return undefined
    const closing = context.lines.indexOf(':::', context.index + 1)
    if (closing === -1) return undefined
    const body = context.lines.slice(context.index + 1, closing).join('\n')
    context.consume(closing - context.index + 1)
    return {
      type: 'component',
      name: 'note',
      attributes: {},
      children: context.parseBlocks(body),
    }
  },
}

console.log(renderHtml(':::note\nCached.\n:::', {
  extensions: [notes],
}))
```

Returning a node advances only one line unless `consume` records the complete owned block.

Source: `docs/guides/extensions.md`

### HIGH Ordering a general parser first

Wrong:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { calloutsExtension } from '@tanstack/markdown/extensions/callouts'
import { renderHtml } from '@tanstack/markdown/html'

const quotedLine: MarkdownExtension = {
  name: 'quoted-line',
  parseBlock(context) {
    const match = (context.lines[context.index] ?? '').match(/^>\s?(.*)$/)
    if (!match) return undefined
    context.consume(1)
    return { type: 'paragraph', children: context.parseInline(match[1] ?? '') }
  },
}

console.log(renderHtml('> [!TIP]\n> Cache it.', {
  extensions: [quotedLine, calloutsExtension()],
}))
```

Correct:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { calloutsExtension } from '@tanstack/markdown/extensions/callouts'
import { renderHtml } from '@tanstack/markdown/html'

const quotedLine: MarkdownExtension = {
  name: 'quoted-line',
  parseBlock(context) {
    const match = (context.lines[context.index] ?? '').match(/^>\s?(.*)$/)
    if (!match) return undefined
    context.consume(1)
    return { type: 'paragraph', children: context.parseInline(match[1] ?? '') }
  },
}

console.log(renderHtml('> [!TIP]\n> Cache it.', {
  extensions: [calloutsExtension(), quotedLine],
}))
```

Extensions run in array order, so the broad quote parser can hide callout syntax from the specific parser.

Source: `docs/guides/extensions.md`

### HIGH Using HTML hooks for framework nodes

Wrong:

```tsx
import type { MarkdownExtension } from '@tanstack/markdown'
import { Markdown } from '@tanstack/markdown/react'

const htmlOnly: MarkdownExtension = {
  name: 'html-only',
  renderHtml(node, context) {
    if (node.type !== 'paragraph') return undefined
    return `<aside>${node.children.map(context.renderInline).join('')}</aside>`
  },
}

export function Article() {
  return <Markdown extensions={[htmlOnly]}>Framework output</Markdown>
}
```

Correct:

```tsx
import { commentComponentsExtension } from '@tanstack/markdown/extensions/comment-components'
import { Markdown } from '@tanstack/markdown/react'
import type { ComponentProps } from 'react'

const components = commentComponentsExtension({
  transformComponent(node) {
    return node.name === 'panel'
      ? { ...node, tagName: 'docs-panel' }
      : node
  },
})

function Panel(props: ComponentProps<'aside'>) {
  return <aside {...props} />
}

export function Article() {
  return (
    <Markdown
      extensions={[components]}
      components={{ 'docs-panel': Panel }}
    >
      {'<!-- ::start:panel -->\nPortable output\n<!-- ::end:panel -->'}
    </Markdown>
  )
}
```

`renderHtml` hooks do not run in React or Octane; a `ComponentNode` and emitted-tag component mapping is the portable path.

Source: `docs/guides/extensions.md`

### MEDIUM Changing extensions after parsing

Wrong:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const emphasisHtml: MarkdownExtension = {
  name: 'emphasis-html',
  renderHtml(node, context) {
    if (node.type !== 'emphasis') return undefined
    return `<i class="accent">${node.children.map(context.renderInline).join('')}</i>`
  },
}

const document = parseMarkdown('_Important_', {
  extensions: [emphasisHtml],
})
console.log(renderHtml(document))
```

Correct:

```ts
import type { MarkdownExtension } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const emphasisHtml: MarkdownExtension = {
  name: 'emphasis-html',
  renderHtml(node, context) {
    if (node.type !== 'emphasis') return undefined
    return `<i class="accent">${node.children.map(context.renderInline).join('')}</i>`
  },
}

const extensions = [emphasisHtml]
const document = parseMarkdown('_Important_', { extensions })
console.log(renderHtml(document, { extensions }))
```

Document transforms persist in the AST, but HTML render hooks require the extension again at render time.

Source: `docs/guides/extensions.md`

## Tensions and Boundaries

### HIGH Rich output versus untrusted-content safety

Prefer `ComponentNode` plus application components for rich output. Treat `allowHtml`, extension HTML strings, and highlighter markup as explicit trusted boundaries; see `production-pipelines`.

### MEDIUM Parse-ahead performance versus option timing

Apply parser options and document-transform extensions before caching a `MarkdownDocument`. Renderer-time options cannot rebuild missing parse behavior; see `render-markdown` and `production-pipelines`.

### HIGH Renderer parity versus customization

Core nodes stay equivalent across HTML, React, and Octane. HTML hooks and framework component replacements intentionally leave that parity boundary; see `react-rendering` and `octane-rendering`.

## Related Skills

- `render-markdown` for the AST, parser options, and standard renderers.
- `docs-features` for first-party extension implementations and metadata contracts.
- `react-rendering` for React mappings of emitted component tags.
- `octane-rendering` for Octane `ComponentBody` mappings.
- `production-pipelines` for trust, compatibility, and bundle audits.
