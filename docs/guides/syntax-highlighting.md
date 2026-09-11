---
title: Syntax Highlighting
---

# Syntax Highlighting

TanStack Markdown does not bundle a tokenizer, language definitions, themes, CSS, or an asynchronous grammar runtime. It accepts one synchronous `CodeHighlighter` callback.

## TanStack Highlight adapter

TanStack Markdown owns the surrounding `<pre><code>` elements. TanStack Highlight's high-level HTML methods also produce those containers, so they must not be passed directly as the callback. `createTanStackMarkdownHighlighter()` returns escaped markup for the inside of Markdown's `<code>` element:

The first-party adapter and renderer-owned theme selectors require `@tanstack/highlight@0.0.6` or newer.

```ts group=syntax-highlighting file=/src/markdown-highlighter.ts
// markdown-highlighter.ts
import { createHighlighter } from '@tanstack/highlight/core'
import { html } from '@tanstack/highlight/languages/html'
import { js } from '@tanstack/highlight/languages/js'
import { plaintext } from '@tanstack/highlight/languages/plaintext'
import { ts } from '@tanstack/highlight/languages/ts'
import { tsx } from '@tanstack/highlight/languages/tsx'
import { createTanStackMarkdownHighlighter } from '@tanstack/highlight/markdown'
import type { CodeHighlighter } from '@tanstack/markdown'

const highlighter = createHighlighter({
  languages: [plaintext, html, js, ts, tsx],
})

export const highlightMarkdownCode: CodeHighlighter =
  createTanStackMarkdownHighlighter(highlighter)
```

```tsx group=syntax-highlighting env=react file=/src/main.tsx entry
import { createThemeCss } from '@tanstack/highlight/theme'
import { githubDarkTheme } from '@tanstack/highlight/themes/github-dark'
import { githubLightTheme } from '@tanstack/highlight/themes/github-light'
import { Markdown } from '@tanstack/markdown/react'
import { highlightMarkdownCode } from './markdown-highlighter'

const source = [
  '# Typed counter',
  '',
  '```tsx {2}',
  'const initialCount: number = 1',
  'const nextCount = initialCount + 1',
  '```',
].join('\n')

const themeCss = createThemeCss({
  light: githubLightTheme,
  dark: githubDarkTheme,
  lightSelector: '.markdown-renderer',
  darkSelector: '.dark .markdown-renderer',
  codeBlockSelector: '.markdown-renderer pre.tm-code',
  lineNumbersSelector: '.markdown-renderer .tm-code--line-numbers',
})

export default function Article() {
  return (
    <article className="markdown-renderer">
      <style>{themeCss}</style>
      <Markdown highlighter={highlightMarkdownCode} codeLineNumbers>
        {source}
      </Markdown>
    </article>
  )
}
```

Register only the languages the application expects. Unknown identifiers degrade to escaped plain text. The example uses the same callback with React.

Or with the HTML renderer:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { highlightMarkdownCode } from './markdown-highlighter'

const html = renderHtml(source, {
  highlighter: highlightMarkdownCode,
  codeLineNumbers: true,
})
```

The callback receives the raw code, the fence language, parsed highlight lines, and the configured line-number preference. Highlighter output is inserted as trusted HTML, so use only an adapter that escapes source text.

## Light and dark themes

`createThemeCss` defines Highlight's variables and token classes. Point its structural rules at Markdown's renderer-owned wrapper classes:

```ts
import { createThemeCss } from '@tanstack/highlight/theme'
import { githubDarkTheme } from '@tanstack/highlight/themes/github-dark'
import { githubLightTheme } from '@tanstack/highlight/themes/github-light'

export const markdownHighlightCss = `${createThemeCss({
  light: githubLightTheme,
  dark: githubDarkTheme,
  lightSelector: '.markdown-renderer',
  darkSelector: '.dark .markdown-renderer',
  codeBlockSelector: '.markdown-renderer pre.tm-code',
  lineNumbersSelector: '.markdown-renderer .tm-code--line-numbers',
})}

.markdown-renderer .th-line--highlighted {
  background: color-mix(in srgb, var(--th-token) 10%, transparent);
}`
```

Wrap rendered content in an element with `className="markdown-renderer"`. When `codeLineNumbers` is true, every renderer adds `tm-code--line-numbers` to the Markdown-owned `<pre>`.

## Fence metadata

````md
```tsx file="app.tsx" framework="react" {2,4-6}
const one = 1
const two = 2
```
````

The parser records metadata even when no highlighter is configured. This keeps content parsing independent from presentation and lets a build pipeline change highlighters without rebuilding the AST.

The complete fence metadata string is available as `CodeBlockNode.meta`, `options.meta` in the highlighter callback, and `data-meta` on the rendered `<pre>` in HTML, React, and Octane. Framework `pre` replacements can read `props['data-meta']`. The attribute and callback field are omitted when there is no metadata. Existing title, filename, framework, and highlighted-line fields remain available.

Metadata is source text, not executable configuration. Validate any values you use to select a custom renderer; never evaluate metadata as code.

## Keep it server-only when possible

For static blogs and docs, parse and highlight during a build or server render, then send the finished markup. The Markdown package does not force highlighting or registered language grammars into client bundles.
