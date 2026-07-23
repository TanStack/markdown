# Docs Metadata Contracts

All `ComponentNode.properties` values are strings. Values described as JSON are produced with `JSON.stringify`. HTML rendering escapes them as attribute values; DOM `dataset` access returns the decoded string.

## Preset Composition

```ts
interface DocsMarkdownOptions {
  collectHeadings?: boolean | HeadingCollectionOptions
}

interface HeadingCollectionOptions {
  skipComponentNames?: ReadonlySet<string> | string[]
}
```

`docsMarkdownExtensions()` returns these extensions in order:

1. `calloutsExtension()`
2. `commentComponentsExtension({ transformComponent: transformDocsComponent })`
3. `headingCollectionExtension()` unless `collectHeadings` is `false`

An object passed as `collectHeadings` configures heading collection. `true` or an omitted value uses defaults.

## Comment Components

Single form:

```md
<!-- ::separator tone="subtle" compact -->
```

Block form:

```md
<!-- ::start:example tone="subtle" -->

Component body

<!-- ::end:example -->
```

Names become lowercase. Attribute names preserve their parsed spelling, and every value is a string. Supported values are double-quoted, single-quoted, unquoted, or valueless; a valueless attribute becomes `"true"`.

The initial AST shape is:

```ts
interface CommentComponentShape {
  type: 'component'
  name: string
  attributes: Record<string, string>
  children: BlockNode[]
}
```

Without a transform-provided `tagName`, HTML uses `md-comment-component`, adds `data-component="<name>"`, and adds `data-attributes="<JSON attributes>"` unless a transform already supplied `data-attributes`.

An unmatched block start produces an empty component and consumes only the start line. Its apparent body is parsed normally outside the component.

## Callouts

Input:

```md
> [!WARNING] Deployment warning
> Back up the database first.
```

`KIND` accepts letters only and becomes lowercase. An omitted title becomes title-cased from the kind. The AST contract is:

```ts
interface CalloutNode {
  type: 'callout'
  kind: string
  title: string
  children: BlockNode[]
}
```

HTML uses:

```html
<div class="markdown-alert markdown-alert-warning"><p class="markdown-alert-title">Deployment warning</p><div class="markdown-alert-content"><p>Back up the database first.</p></div></div>
```

## Heading Collection

The document property is:

```ts
interface MarkdownHeading {
  id: string
  text: string
  level: number
  framework?: string
}
```

Only headings with generated IDs are collected. Traversal includes lists, blockquotes, callouts, and components. By default, any subtree inside a component whose `name` is `tabs` is skipped.

Passing `skipComponentNames` replaces the default set; include `'tabs'` explicitly when adding more names:

```ts
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

export const extensions = docsMarkdownExtensions({
  collectHeadings: {
    skipComponentNames: ['tabs', 'example'],
  },
})
```

Within an `md-framework-panel`, collected nested headings receive the panel's `data-framework` value.

## Tab Metadata

### Shared tab descriptors

Heading, file, and bundler tabs set:

```ts
interface TabsProperty {
  'data-attributes': string
}

interface TabsMetadata {
  tabs: Array<{
    slug: string
    name: string
  }>
}
```

Each generated panel is:

```ts
interface TabPanelShape {
  type: 'component'
  name: 'tab-panel'
  tagName: 'md-tab-panel'
  attributes: {}
  properties: {
    'data-tab-slug': string
    'data-tab-index': string
    'data-content'?: 'code-only' | 'mixed'
  }
  children: BlockNode[]
}
```

`data-tab-index` is a zero-based integer encoded as a string.

### Heading tabs

Missing or unknown `variant` values dispatch to heading tabs. Sections split at the shallowest heading depth found among direct component children. The section heading is removed from panel children.

Slugs use the heading ID when present. Otherwise they are lowercase ASCII slugs with non-alphanumeric characters removed, repeated whitespace converted to `-`, repeated hyphens collapsed, and length capped at 64 characters. The fallback is `tab-<one-based-index>`.

No headings means the original component is returned.

### File tabs

Only direct `code` children become files; other children are discarded when at least one code block exists.

Tab descriptors use:

```ts
{
  slug: `file-${zeroBasedIndex}`,
  name: code.title || code.file || 'Untitled',
}
```

The root also sets:

```ts
interface FilesMetadata {
  files: Array<{
    title: string
    code: string
    language: string
  }>
}

interface FileTabsProperties {
  'data-attributes': string
  'data-files-meta': string
}
```

`data-files-meta` is JSON-encoded `FilesMetadata`. `title` falls back through `code.title`, `code.file`, then `"Untitled"`; `language` falls back to `"plaintext"`. Every panel contains its original code node.

No direct code children means the original component is returned.

### Package-manager tabs

Accepted variants are `package-manager` and `package-managers`. Each nonempty source line uses:

```text
framework: package-one package-two
```

Framework names become lowercase. Repeated framework lines append package arrays rather than merging them.

The root sets:

```ts
interface PackageManagerMetadata {
  packagesByFramework: Record<string, string[][]>
  mode: 'install' | 'dev-install' | 'local-install'
}

interface PackageManagerProperties {
  'data-package-manager-meta': string
}
```

`data-package-manager-meta` is JSON-encoded `PackageManagerMetadata`. Only `dev-install` and `local-install` are preserved; an omitted, differently cased, or unknown mode resolves after lowercasing to `install`. Successful transformation replaces all children with an empty array and emits no `md-tab-panel` children.

No valid `framework: packages` line means the original component is returned.

### Bundler tabs

The only supported section names are `vite` and `rsbuild`, matched case-insensitively and emitted in that fixed order when present. Sections split at the shallowest direct heading depth.

The root sets:

```ts
interface BundlerMetadata {
  bundlers: Array<'vite' | 'rsbuild'>
}

interface BundlerTabsProperties {
  'data-attributes': string
  'data-bundler-meta': string
}
```

`data-bundler-meta` is JSON-encoded `BundlerMetadata`. Each panel additionally sets `data-content` to `"code-only"` only when the section has exactly one child and that child is a code block; every other shape uses `"mixed"`.

No supported section means the original component is returned.

## Framework Metadata

Framework transforms split only on direct level-one headings. A valid root sets:

```ts
interface FrameworkMetadata {
  codeBlocksByFramework: Record<
    string,
    Array<{
      title: string
      code: string
      language: string
    }>
  >
}

interface FrameworkProperties {
  'data-available-frameworks': string
  'data-framework-meta': string
}
```

`data-available-frameworks` is a JSON array of lowercase heading text in source order. `data-framework-meta` is JSON-encoded `FrameworkMetadata`. Only direct code children of each framework section enter `codeBlocksByFramework`; title defaults to `""` and language to `"plaintext"`.

Each panel is:

```ts
interface FrameworkPanelShape {
  type: 'component'
  name: 'framework-panel'
  tagName: 'md-framework-panel'
  attributes: {}
  properties: {
    'data-framework': string
  }
  children: BlockNode[]
}
```

The level-one selector heading is removed. Descendant headings deeper than level one receive the lowercase framework label, including headings nested through blockquotes, callouts, lists, and components.

No direct level-one heading means the original component is returned.

## Code Fence Metadata

Code metadata is parsed by the core parser, not by `docsMarkdownExtensions`.

````md
```tsx file="app.tsx" framework="React" {2,4-6}
export function App() {
  return <main>Docs</main>
}
```
````

The code node fields are:

```ts
interface CodeBlockNode {
  type: 'code'
  lang?: string
  meta?: string
  title?: string
  framework?: string
  file?: string
  value: string
  highlightLines?: number[]
}
```

- The first language token accepts letters, digits, `_`, `+`, `.`, `#`, and `-`.
- `meta` stores the trimmed text after the language.
- The first `title=` or `file=` value sets both `title` and `file`.
- `framework=` becomes lowercase.
- `{2,4-6}` and `lines=2,4-6` produce sorted, unique positive line numbers.
- Invalid ranges are ignored, and each individual range expands to at most 1,000 lines.

HTML code blocks expose `data-lang`, `data-code-title`, `data-filename`, and `data-framework` when the corresponding values exist. Highlight lines are passed to a configured highlighter; metadata alone does not create token or line markup.
