# TanStack Markdown

A tiny, fast, deterministic Markdown parser and renderer for blogs and documentation.

- 4.6 KB gzip parser
- 6.4 KB gzip HTML renderer
- 6.3 KB gzip React adapter
- zero runtime dependencies
- serializable AST
- safe defaults for raw HTML and executable URLs
- optional docs extensions and external syntax highlighting

```bash
pnpm add @tanstack/markdown
```

```ts
import { renderHtml } from '@tanstack/markdown/html'

const html = renderHtml('# Fast by default')
```

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function Article({ source }: { source: string }) {
  return <Markdown>{source}</Markdown>
}
```

TanStack Markdown targets controlled technical content. It supports the Markdown used by blogs and docs, then spends its remaining complexity budget on deterministic output, HTML/React parity, malformed-input resilience, and small entry points. It is intentionally not a complete CommonMark, GFM, MDX, or general content-processing implementation.

## Documentation

- [Overview](./docs/overview.md)
- [Installation](./docs/installation.md)
- [Quick Start](./docs/quick-start.md)
- [Comparison](./docs/comparison.md)
- [Syntax Profile](./docs/core-concepts/syntax-profile.md)
- [React Guide](./docs/guides/react.md)
- [Syntax Highlighting](./docs/guides/syntax-highlighting.md)
- [Extensions](./docs/guides/extensions.md)
- [API Reference](./docs/reference/index.md)
- [Architecture](./docs/project/architecture.md)

## Verification

```bash
pnpm run verify
```

To include downstream content in the corpus gate:

```bash
MARKDOWN_CORPUS_DIRS=../tanstack.com/src/blog:../tanstack.com/docs \
  pnpm run test:corpus
```

Generated reports:

- [Bundle sizes](./reports/sizes.md)
- [Benchmarks](./reports/benchmarks.md)
- [CommonMark compatibility accounting](./reports/conformance.md)
