---
title: Extensions
---

# Extensions

Every built-in extension is available through a separate package entry.

## Callouts

Import from `@tanstack/markdown/extensions/callouts`.

### `calloutsExtension`

```ts
function calloutsExtension(): MarkdownExtension
```

Creates the block parser for GitHub-style `> [!KIND] Optional title` callouts.

### `parseCalloutBlock`

```ts
function parseCalloutBlock(
  context: BlockParseContext,
): CalloutNode | undefined
```

Low-level parser used by `calloutsExtension`.

## Comment components

Import from `@tanstack/markdown/extensions/comment-components`.

### `CommentComponentOptions`

Provides an optional `transformComponent(node)` callback that receives each parsed `ComponentNode`.

### `ComponentComment`

Parsed comment data with `block`, lowercase `name`, and string `attributes`.

### `commentComponentsExtension`

```ts
function commentComponentsExtension(
  options?: CommentComponentOptions,
): MarkdownExtension
```

Parses single `<!-- ::name -->` comments and paired `<!-- ::start:name -->` / `<!-- ::end:name -->` blocks.

### `parseCommentComponentBlock`

Parses a component at the current block context and optionally transforms it.

### `parseComponentComment`

```ts
function parseComponentComment(
  line: string,
): ComponentComment | undefined
```

Parses one component start or single-component comment.

### `parseAttributes`

```ts
function parseAttributes(value: string): Record<string, string>
```

Parses quoted, unquoted, and boolean-style attributes. A valueless attribute becomes the string `"true"`.

## Docs preset

Import from `@tanstack/markdown/extensions/docs`.

### `DocsMarkdownOptions`

Contains `collectHeadings?: boolean | HeadingCollectionOptions`.

### `docsMarkdownExtensions`

```ts
function docsMarkdownExtensions(
  options?: DocsMarkdownOptions,
): MarkdownExtension[]
```

Returns callouts, transformed comment components, and heading collection unless collection is disabled.

### `transformDocsComponent`

Routes `tabs` and `framework` component nodes to their built-in transforms and returns other nodes unchanged.

## Framework transform

Import from `@tanstack/markdown/extensions/framework`.

### `transformFrameworkComponent`

```ts
function transformFrameworkComponent(
  node: ComponentNode,
): ComponentNode
```

Splits level-one framework sections into `md-framework-panel` children, records available-framework and code-block metadata, and labels nested headings by framework.

## Heading collection

Import from `@tanstack/markdown/extensions/headings`.

### `HeadingCollectionOptions`

Contains `skipComponentNames?: ReadonlySet<string> | string[]`. The default skips headings inside `tabs` components.

### `headingCollectionExtension`

```ts
function headingCollectionExtension(
  options?: HeadingCollectionOptions,
): MarkdownExtension
```

Creates a document transform that writes collected headings to `document.headings`.

### `collectMarkdownHeadings`

```ts
function collectMarkdownHeadings(
  document: MarkdownDocument,
  options?: HeadingCollectionOptions,
): MarkdownHeading[]
```

Collects headings recursively through lists, blockquotes, callouts, and components while respecting skipped component names and framework labels.

## Tab transforms

Import from `@tanstack/markdown/extensions/tabs`.

### `transformTabsComponent`

Dispatches by the component’s `variant` attribute. Unknown or missing variants use heading-based tabs.

### `transformFileTabs`

Turns code-block children into `md-tab-panel` elements and records file names, languages, and code in data properties.

### `transformPackageManagerTabs`

Parses `framework: package...` lines and records package groups plus `install`, `dev-install`, or `local-install` mode.

### `transformBundlerTabs`

Selects Vite and Rsbuild heading sections and converts them to panels.

### `transformHeadingTabs`

Splits content at the shallowest heading depth, creates stable tab slugs, and emits one panel per section.

The transforms return the original node when their expected input structure is absent.
