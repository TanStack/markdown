# AST and Options Reference

This reference targets `@tanstack/markdown@0.0.10`. Shared public types are
exported from `@tanstack/markdown`.

## Entry Points

Use the narrowest entry point needed by the application:

```ts
import {
  parseInline,
  parseMarkdown,
  renderBlock,
  renderDocument,
  renderHtml,
  renderInline,
  type MarkdownDocument,
  type ParseOptions,
  type RenderOptions,
} from '@tanstack/markdown'

const options: ParseOptions = {
  frontmatter: true,
  headingIds: true,
}

const document: MarkdownDocument = parseMarkdown('# API', options)
const inline = parseInline('Use **stable** APIs.')
const blockHtml = document.children.map(node => renderBlock(node)).join('\n')
const inlineHtml = inline.map(node => renderInline(node)).join('')
const documentHtml = renderDocument(document)
const completeHtml = renderHtml(document, {
  headingAnchors: true,
} satisfies RenderOptions)

console.log({ blockHtml, inlineHtml, documentHtml, completeHtml })
```

Equivalent narrow imports are:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import {
  renderBlock,
  renderDocument,
  renderHtml,
  renderInline,
} from '@tanstack/markdown/html'

const document = parseMarkdown('# Narrow imports')
const html = renderHtml(document)

console.log({
  html,
  documentHtml: renderDocument(document),
  firstBlockHtml: renderBlock(document.children[0]!),
  inlineHtml: renderInline({
    type: 'text',
    value: 'Inline text',
  }),
})
```

## Function Signatures

```ts
import type {
  BlockNode,
  InlineNode,
  MarkdownDocument,
  MarkdownInput,
  ParseOptions,
  RenderOptions,
} from '@tanstack/markdown'

declare function parseMarkdown(
  markdown: string,
  options?: ParseOptions,
): MarkdownDocument

declare function parseInline(
  value: string,
  options?: ParseOptions,
): InlineNode[]

declare function renderHtml(
  input: MarkdownInput,
  options?: RenderOptions,
): string

declare function renderDocument(
  document: MarkdownDocument,
  options?: RenderOptions,
): string

declare function renderBlock(
  node: BlockNode,
  options?: RenderOptions,
): string

declare function renderInline(
  node: InlineNode,
  options?: RenderOptions,
): string
```

`MarkdownInput` is `string | MarkdownDocument`. Only complete-document
renderers accept source strings. `renderBlock` and `renderInline` accept one
already-parsed node.

## Document Shape

```ts
import type { BlockNode, MarkdownHeading } from '@tanstack/markdown'

interface MarkdownDocument {
  type: 'root'
  children: BlockNode[]
  frontmatter?: string
  headings?: MarkdownHeading[]
}
```

- `frontmatter` contains the raw text between leading `---` delimiters.
- `headings` is optional extension-derived data, not part of core parsing.
- The object is plain and serializable.
- Because the package is pre-1.0, persisted ASTs should be regenerated after
  an upgrade that changes node contracts.

## Block Nodes

`BlockNode` is a discriminated union:

| `type` | Interface | Fields beyond `type` |
| --- | --- | --- |
| `heading` | `HeadingNode` | `depth`, optional `id`, optional `framework`, inline `children` |
| `paragraph` | `ParagraphNode` | inline `children` |
| `code` | `CodeBlockNode` | raw `value`; optional `lang`, `meta`, `title`, `file`, `framework`, `highlightLines` |
| `list` | `ListNode` | `ordered`, optional `start`, optional `loose`, `items` |
| `blockquote` | `BlockquoteNode` | block `children` |
| `table` | `TableNode` | per-column `align`, `header`, body `rows` |
| `footnotes` | `FootnotesNode` | `items` |
| `thematicBreak` | `ThematicBreakNode` | no additional fields |
| `html` | `HtmlBlockNode` | raw `value` |
| `callout` | `CalloutNode` | `kind`, `title`, block `children` |
| `component` | `ComponentNode` | `name`, `attributes`, block `children`, optional `tagName`, optional `properties` |

Supporting block shapes:

```ts
import type { BlockNode, InlineNode } from '@tanstack/markdown'

interface ListItemNode {
  type: 'listItem'
  checked?: boolean
  children: BlockNode[]
}

interface TableCellNode {
  type: 'tableCell'
  children: InlineNode[]
}

interface FootnoteItemNode {
  id: string
  number: number
  referenceCount?: number
  children: BlockNode[]
}
```

Important rendering invariants:

- `ListNode.loose: true` preserves paragraph wrappers for every list item.
- `ListItemNode.checked` controls task-list checkbox rendering.
- A non-`1` ordered-list `start` renders the corresponding `<ol start>`.
- `HtmlBlockNode` is created only when parsing with `allowHtml: true`.
- `CalloutNode` and `ComponentNode` are extension-oriented public nodes.

## Inline Nodes

`InlineNode` is a discriminated union:

| `type` | Interface | Fields beyond `type` |
| --- | --- | --- |
| `text` | `TextNode` | `value` |
| `inlineCode` | `CodeSpanNode` | `value` |
| `strong` | `StrongNode` | inline `children` |
| `emphasis` | `EmphasisNode` | inline `children` |
| `strike` | `StrikeNode` | inline `children` |
| `footnoteReference` | `FootnoteReferenceNode` | normalized `id`, display `number`, optional `referenceIndex` |
| `link` | `LinkNode` | sanitized `href`, optional `title`, inline `children` |
| `image` | `ImageNode` | sanitized `src`, text `alt`, optional `title` |
| `break` | `BreakNode` | no additional fields |
| `inlineHtml` | `HtmlInlineNode` | raw `value` |

`HtmlInlineNode` is created only when parsing with `allowHtml: true`.
Repeated footnote references use `referenceIndex` to produce unique source
IDs and back links.

## Parse Options

```ts
import type {
  FootnoteDefinition,
  LinkReferenceDefinition,
  MarkdownExtension,
} from '@tanstack/markdown'

interface ParseOptions {
  allowHtml?: boolean
  frontmatter?: boolean
  headingIds?: boolean | ((text: string, index: number) => string)
  extensions?: MarkdownExtension[]
  references?: Record<string, LinkReferenceDefinition>
  footnotes?: Record<string, FootnoteDefinition>
  footnoteOrder?: string[]
  footnoteCounts?: Record<string, number>
}
```

| Option | Default | Contract |
| --- | --- | --- |
| `allowHtml` | `false` | Recognize raw block and inline HTML nodes. Rendering also requires this option to emit their raw values. |
| `frontmatter` | `true` | Extract one leading `---` block into `document.frontmatter`. The library does not parse YAML. |
| `headingIds` | `true` | Generate duplicate-safe IDs, disable IDs with `false`, or return an ID from `(text, normalizedLineIndex)`. |
| `extensions` | `[]` | Run block parsers and inline/document transforms in array order. |
| `references` | internal | Carry normalized reference definitions through nested parsing. |
| `footnotes` | internal | Carry normalized footnote definitions through nested parsing. |
| `footnoteOrder` | internal | Track first-reference order through nested parsing. |
| `footnoteCounts` | internal | Track repeated references for unique IDs and back links. |

Ordinary complete-document calls should leave the four parser-state fields
unset. They are public for extension-driven nested parsing.

The custom heading ID callback receives a zero-based line index after input
normalization and possible frontmatter/definition extraction. Treat it as a
stable parser index, not a source-location API.

## Render Options

`RenderOptions` extends every `ParseOptions` field:

```ts
import type { ParseOptions } from '@tanstack/markdown'

interface RenderOptions extends ParseOptions {
  highlighter?: CodeHighlighter
  codeLineNumbers?: boolean
  headingAnchors?: boolean | HeadingAnchorOptions
}

interface HeadingAnchorOptions {
  content?: string
  className?: string
  ariaHidden?: boolean
  tabIndex?: number
}

interface CodeHighlightOptions {
  highlightLines?: number[]
  lineNumbers?: boolean
}

interface CodeHighlighter {
  (
    code: string,
    lang?: string,
    options?: CodeHighlightOptions,
  ): string
}
```

| Option | Default | Contract |
| --- | --- | --- |
| `highlighter` | none | Return trusted HTML for the contents of the emitted `<code>` element. |
| `codeLineNumbers` | unset | Forward the preference to the highlighter as `lineNumbers`. |
| `headingAnchors` | `false` | Append a default or configured anchor to headings that already have IDs. |

For a source-string input, `renderHtml(source, options)` parses and renders
with the same options. For a `MarkdownDocument` input, parser options cannot
change existing AST structure. Renderer options and extension `renderHtml`
hooks still apply.

## Derived Data Shapes

```ts
import type { BlockNode } from '@tanstack/markdown'

interface MarkdownHeading {
  id: string
  text: string
  level: number
  framework?: string
}

interface LinkReferenceDefinition {
  href: string
  title?: string
}

interface FootnoteDefinition {
  label: string
  content: string
  id?: string
}

const heading: MarkdownHeading = {
  id: 'install',
  text: 'Install',
  level: 2,
}

const reference: LinkReferenceDefinition = {
  href: '/install',
  title: 'Installation',
}

const footnote: FootnoteDefinition = {
  label: 'support',
  content: 'Supported in maintained browsers.',
}

const blocks: BlockNode[] = []

console.log({ heading, reference, footnote, blocks })
```

Core parsing does not populate `document.headings`; the heading collection
extension does. Link and footnote definition maps are parser state and are
normally extracted automatically by `parseMarkdown`.

## Narrowing the AST

Use each node's `type` discriminant:

```ts
import {
  parseMarkdown,
  type HeadingNode,
  type MarkdownDocument,
} from '@tanstack/markdown'

function collectHeadings(document: MarkdownDocument): HeadingNode[] {
  return document.children.filter(
    (node): node is HeadingNode => node.type === 'heading',
  )
}

const document = parseMarkdown(`# Guide

## Install

Content`)

const headings = collectHeadings(document)

console.log(headings.map(heading => ({
  depth: heading.depth,
  id: heading.id,
})))
```

The same `MarkdownDocument` can be serialized, transformed as plain data, or
rendered through HTML, React, and Octane adapters.
