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
  type MarkdownComponentProps,
  type MarkdownComponents,
  type MarkdownProps,
  type MarkdownReactOptions,
} from '@tanstack/markdown/react'
```

## `MarkdownComponentProps`

Returns `React.ComponentPropsWithoutRef<TagName>` for an intrinsic tag name. Use it when declaring a replacement separately from a component map.

## `MarkdownComponents`

An opt-in authoring type that maps known intrinsic tag names to another tag or a component with matching intrinsic props. It also accepts arbitrary string keys for extension component tags. Use it with `satisfies` to get element-specific inference without narrowing the renderer's backwards-compatible input contract.

## `MarkdownReactOptions`

Extends `RenderOptions` with:

```ts
interface MarkdownReactOptions extends RenderOptions {
  components?: Partial<
    Record<string, string | React.ComponentType<any>>
  >
}
```

`components` replaces an emitted intrinsic or custom element by tag name. Its accepted input remains permissive for backwards compatibility; `MarkdownComponents` provides stricter opt-in validation.

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
