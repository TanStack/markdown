---
title: Syntax Highlighting
---

# Syntax Highlighting

TanStack Markdown does not bundle a tokenizer, language definitions, themes, CSS, or an asynchronous grammar runtime. It accepts one synchronous `CodeHighlighter` callback.

## Connect a highlighter

```ts
import { renderHtml } from '@tanstack/markdown/html'
import {
  renderNodesToHtml,
  renderTokens,
  tokenize,
} from '@tanstack/highlight'

const html = renderHtml(source, {
  highlighter(code, lang, options) {
    const result = tokenize(code, { lang })
    return renderNodesToHtml(
      renderTokens(result.tokens, {
        lineNumbers: options?.lineNumbers,
        decorations: options?.highlightLines?.map((line) => ({
          lines: line,
          className: 'is-highlighted',
        })),
      }),
    )
  },
})
```

The exact adapter depends on the highlighter’s output contract. The callback receives:

- the raw code string
- the fence language, defaulting to `plaintext`
- `highlightLines` parsed from fence metadata
- `lineNumbers` from render options

## Fence metadata

````md
```tsx file="app.tsx" framework="react" {2,4-6}
const one = 1
const two = 2
```
````

The parser records metadata even when no highlighter is configured. This keeps content parsing independent from presentation and lets a build pipeline change highlighters without rebuilding the AST.

## Output contract

The callback must return markup for the contents of `<code>`, not a surrounding `<pre>` or `<code>` element. The renderer supplies those containers. For example, do not pass TanStack Highlight's `highlightToHtml` directly because that convenience function returns its own complete `<pre><code>` tree.

Highlighter output is inserted as trusted HTML in both renderers. The highlighter must escape source text and return markup that is safe for the content being rendered.

## Keep it server-only when possible

For static blogs and docs, parse and highlight during a build or server render, then send the finished markup. The Markdown package does not force highlighting into client bundles.
