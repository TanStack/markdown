---
title: Octane
---

# Octane

The `@tanstack/markdown/octane` entry requires Octane 0.1.12 or newer.

```ts
import {
  Markdown,
  renderBlockOctane,
  renderInlineOctane,
  renderMarkdownOctane,
  type MarkdownOctaneOptions,
  type MarkdownProps,
} from '@tanstack/markdown/octane'
```

## `MarkdownOctaneOptions`

Extends `RenderOptions` with:

```ts
interface MarkdownOctaneOptions extends RenderOptions {
  components?: Partial<
    Record<string, string | ComponentBody<any>>
  >
}
```

`components` replaces an emitted intrinsic or custom element by tag name.

## `MarkdownProps`

Extends `MarkdownOctaneOptions` with `children: MarkdownInput`.

## `Markdown`

```ts
function Markdown(props: MarkdownProps): ElementDescriptor
```

Renders the document children inside an Octane fragment descriptor.

## `renderMarkdownOctane`

```ts
function renderMarkdownOctane(
  input: MarkdownInput,
  options?: MarkdownOctaneOptions,
): OctaneNode[]
```

Returns rendered Octane nodes without the fragment wrapper.

## `renderBlockOctane`

```ts
function renderBlockOctane(
  node: BlockNode,
  options?: MarkdownOctaneOptions,
  key?: string,
): ElementDescriptor
```

Renders one block node. `key` is available for custom tree composition; normal document rendering supplies deterministic positional keys.

## `renderInlineOctane`

```ts
function renderInlineOctane(
  node: InlineNode,
  options?: MarkdownOctaneOptions,
  key?: string,
): OctaneNode
```

Renders one inline node.

See the [Octane Guide](../guides/octane) for TSRX, component mapping, and SSR usage.
