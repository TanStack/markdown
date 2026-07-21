# API Reference

## `createMarkdownRenderer`

```ts title="renderer.ts" {5-8}
export interface RendererOptions {
  allowHtml?: boolean
  headingIds?: boolean
}

export function createMarkdownRenderer(options: RendererOptions = {}) {
  return {
    render(markdown: string) {
      return renderHtml(markdown, options)
    },
  }
}
```

```tsx title="component.tsx"
function MarkdownView({ source }: { source: string }) {
  return (
    <article
      className="docs"
      dangerouslySetInnerHTML={{ __html: renderHtml(source) }}
    />
  )
}
```

```json
{
  "name": "@tanstack/markdown",
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": "./dist/index.js",
    "./react": "./dist/react.js"
  }
}
```

```css
.tm-code {
  overflow: auto;
  font: 13px ui-monospace, monospace;
}

.tm-line-highlight {
  background: color-mix(in srgb, Highlight 15%, transparent);
}
```

```html
<article>
  <h1 id="api-reference">API Reference</h1>
  <pre><code>const value = true</code></pre>
</article>
```
