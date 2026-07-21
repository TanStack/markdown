---
title: React
---

# React

The `@tanstack/markdown/react` entry requires React 18 or newer.

```tsx
import {
  Markdown,
  renderBlockReact,
  renderInlineReact,
  renderMarkdownReact,
  type MarkdownProps,
  type MarkdownReactOptions,
} from '@tanstack/markdown/react'
```

## `MarkdownReactOptions`

Extends `RenderOptions` with:

```ts
interface MarkdownReactOptions extends RenderOptions {
  components?: Partial<
    Record<string, string | React.ComponentType<any>>
  >
}
```

`components` replaces an emitted intrinsic or custom element by tag name.

## `MarkdownProps`

Extends `MarkdownReactOptions` with `children: MarkdownInput`.

## `Markdown`

```ts
function Markdown(props: MarkdownProps): ReactElement
```

Renders the document children inside a React fragment.

## `renderMarkdownReact`

```ts
function renderMarkdownReact(
  input: MarkdownInput,
  options?: MarkdownReactOptions,
): ReactNode
```

Returns rendered React nodes without JSX component syntax.

## `renderBlockReact`

```ts
function renderBlockReact(
  node: BlockNode,
  options?: MarkdownReactOptions,
  key?: string,
): ReactElement
```

Renders one block node. `key` is available for custom tree composition; normal document rendering supplies deterministic positional keys.

## `renderInlineReact`

```ts
function renderInlineReact(
  node: InlineNode,
  options?: MarkdownReactOptions,
  key?: string,
): ReactNode
```

Renders one inline node.

See the [React Guide](../guides/react) for component mapping and SSR usage.
