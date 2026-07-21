---
title: Types
---

# Types

All shared types are exported from `@tanstack/markdown`.

## Documents and unions

### `MarkdownInput`

`string | MarkdownDocument`. Accepted by the complete-document renderers.

### `MarkdownDocument`

The root object with `type: 'root'`, `children: BlockNode[]`, optional raw `frontmatter`, and optional collected `headings`.

### `BlockNode`

Union of `HeadingNode`, `ParagraphNode`, `CodeBlockNode`, `ListNode`, `BlockquoteNode`, `TableNode`, `FootnotesNode`, `ThematicBreakNode`, `HtmlBlockNode`, `CalloutNode`, and `ComponentNode`.

### `InlineNode`

Union of `TextNode`, `CodeSpanNode`, `StrongNode`, `EmphasisNode`, `StrikeNode`, `FootnoteReferenceNode`, `LinkNode`, `ImageNode`, `BreakNode`, and `HtmlInlineNode`.

## Block nodes

### `HeadingNode`

Contains `depth` from 1 through 6, optional `id` and `framework`, and inline `children`.

### `ParagraphNode`

Contains inline `children`.

### `CodeBlockNode`

Contains raw `value` plus optional `lang`, `meta`, `title`, `file`, `framework`, and `highlightLines` metadata.

### `ListNode`

Contains `ordered`, optional `start`, optional `loose`, and `items: ListItemNode[]`. A true `loose` value preserves paragraph wrappers in every item.

### `ListItemNode`

Contains block `children` and optional task-list `checked` state.

### `BlockquoteNode`

Contains nested block `children`.

### `TableNode`

Contains per-column `align`, a `header`, and body `rows` made from `TableCellNode` values.

### `TableCellNode`

Contains inline `children`.

### `FootnotesNode`

Generated document block containing `items: FootnoteItemNode[]`.

### `FootnoteItemNode`

Contains a collision-safe `id`, display `number`, optional `referenceCount`, and block `children`.

### `ThematicBreakNode`

Marker node with `type: 'thematicBreak'`.

### `HtmlBlockNode`

Contains raw HTML `value`. It is created only when HTML parsing is enabled.

### `CalloutNode`

Contains a callout `kind`, display `title`, and block `children`. It is produced by the callouts extension.

### `ComponentNode`

Contains source `name`, parsed `attributes`, block `children`, and optional rendered `tagName` and string `properties`. Docs transforms use it for tabs and framework panels.

## Inline nodes

### `TextNode`

Contains plain text `value`.

### `CodeSpanNode`

Contains inline code `value`.

### `StrongNode`

Contains inline `children` rendered as strong text.

### `EmphasisNode`

Contains inline `children` rendered as emphasized text.

### `StrikeNode`

Contains inline `children` rendered as deleted text.

### `FootnoteReferenceNode`

Contains normalized footnote `id`, display `number`, and optional `referenceIndex` for repeated references.

### `LinkNode`

Contains sanitized `href`, optional `title`, and inline `children`.

### `ImageNode`

Contains sanitized `src`, text `alt`, and optional `title`.

### `BreakNode`

Marker node with `type: 'break'`.

### `HtmlInlineNode`

Contains raw inline HTML `value`. It is created only when HTML parsing is enabled.

## Parsing and rendering options

### `ParseOptions`

Configures `allowHtml`, `frontmatter`, `headingIds`, and `extensions`. It also exposes `references`, `footnotes`, `footnoteOrder`, and `footnoteCounts` state used by nested parser contexts.

### `RenderOptions`

Extends `ParseOptions` with `highlighter`, `codeLineNumbers`, and `headingAnchors`.

### `CodeHighlighter`

Synchronous callback `(code, lang?, options?) => string`. The returned string is trusted HTML for the contents of `<code>`.

### `CodeHighlightOptions`

Contains optional `highlightLines` and `lineNumbers` passed to a `CodeHighlighter`.

### `HeadingAnchorOptions`

Configures anchor `content`, `className`, `ariaHidden`, and `tabIndex`.

## Extension contracts

### `MarkdownExtension`

Named hook object with optional `parseBlock`, `transformDocument`, `transformInline`, and `renderHtml` functions.

### `BlockParseContext`

Provides source `lines`, current `index`, active `options`, nested `parseInline` and `parseBlocks` helpers, and `consume`.

### `InlineTransformContext`

Provides active parse `options` to inline transforms.

### `DocumentTransformContext`

Provides active parse `options` to document transforms.

### `HtmlRenderContext`

Provides active render `options` and recursive `renderBlock` and `renderInline` functions.

## Supporting data

### `MarkdownHeading`

Collected heading data with `id`, `text`, numeric `level`, and optional `framework`.

### `LinkReferenceDefinition`

Normalized reference data with `href` and optional `title`.

### `FootnoteDefinition`

Footnote source data with original `label`, Markdown `content`, and optional generated `id`.
