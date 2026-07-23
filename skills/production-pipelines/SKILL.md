---
name: 'production-pipelines'
description: >
  Audit and ship a production Markdown pipeline with explicit trust boundaries,
  external syntax highlighting, parse-ahead caching, compatibility checks,
  deterministic output, and bundle budgets. Load before deploying blogs, docs,
  or untrusted-content rendering.
metadata:
  type: lifecycle
  library: '@tanstack/markdown'
  library_version: '0.0.10'
requires:
  - 'render-markdown'
sources:
  - 'TanStack/markdown:docs/core-concepts/security.md'
  - 'TanStack/markdown:docs/core-concepts/document-model.md'
  - 'TanStack/markdown:docs/core-concepts/syntax-profile.md'
  - 'TanStack/markdown:docs/guides/react.md'
  - 'TanStack/markdown:docs/guides/syntax-highlighting.md'
  - 'TanStack/markdown:docs/guides/performance.md'
  - 'TanStack/markdown:docs/guides/testing.md'
  - 'TanStack/markdown:docs/comparison.md'
  - 'TanStack/markdown:src/utils.ts'
  - 'TanStack/markdown:tests/security.test.tsx'
  - 'TanStack/markdown:tests/bundle-size.test.ts'
---

This skill builds on `render-markdown`. Read it first for the supported syntax, AST, parser options, and renderer contracts.

# TanStack Markdown — Production Pipeline Checklist

Run every section before deploying a blog, documentation site, or user-content renderer.

## Trust Boundary Checks

### Check: Classify every Markdown source

Expected:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderUntrustedMarkdown(
  source: string,
  sanitize: (html: string) => string,
): string {
  const rendered = renderHtml(source)
  return sanitize(rendered)
}
```

Fail condition: Untrusted input reaches `allowHtml`, an unaudited extension `renderHtml` hook, or an unaudited highlighter.

Fix: Separate trusted and untrusted entry points, keep trusted callbacks disabled for untrusted content, and enforce application link, image, and final-HTML policy.

## Highlighting Checks

### Check: Return trusted code contents only

Expected:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import {
  renderNodesToHtml,
  renderTokens,
  tokenize,
} from '@tanstack/highlight'

const source = '```ts {1}\nconst answer = 42\n```'

export const html = renderHtml(source, {
  highlighter(code, lang, options) {
    const result = tokenize(code, { lang: lang ?? 'plaintext' })
    const decorations = options?.highlightLines?.map((lines) => ({ lines, className: 'is-highlighted' }))
    return renderNodesToHtml(renderTokens(result.tokens, { lineNumbers: options?.lineNumbers, decorations }))
  },
})
```

Fail condition: The callback returns a complete `<pre><code>` tree, does not escape source code, or comes from an unreviewed transform.

Fix: Return only escaped markup for the renderer-owned `<code>` contents, and run highlighting during ingestion, build, or server rendering.

## Compatibility Checks

### Check: Validate the actual content corpus

Expected:

```bash
MARKDOWN_CORPUS_DIRS=../site/src/blog:../site/docs pnpm run test:corpus
pnpm run corpus:audit:tanstack
pnpm run corpus:audit:external
```

Fail condition: Adoption relies only on CommonMark examples or a comparison table instead of the site's Markdown.

Fix: Add downstream content directories, preserve practical regressions with focused fixtures, and require renderer and bundle accounting for new syntax.

### Check: Verify deterministic output

Expected:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const source = '# Deterministic\n\n- one\n- two'
const firstDocument = JSON.stringify(parseMarkdown(source))
const secondDocument = JSON.stringify(parseMarkdown(source))
const firstHtml = renderHtml(source)
const secondHtml = renderHtml(source)

if (firstDocument !== secondDocument || firstHtml !== secondHtml) {
  throw new Error('Markdown output is nondeterministic')
}
```

Fail condition: Identical source and options produce different serialized AST or HTML.

Fix: Remove time, randomness, environment state, and unstable ordering from extensions and render callbacks.

## Performance and Cache Checks

### Check: Parse once with final options

Expected:

```ts
import type { MarkdownDocument } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

const cache = new Map<string, MarkdownDocument>()

export function renderCachedArticle(key: string, source: string): string {
  const cacheKey = `markdown-0.0.10:${key}`
  let document = cache.get(cacheKey)
  if (!document) {
    document = parseMarkdown(source, {
      frontmatter: true,
      headingIds: true,
    })
    cache.set(cacheKey, document)
  }
  return renderHtml(document)
}
```

Fail condition: Stable content is reparsed per request, or parser options/extensions change after the AST is cached.

Fix: Build the AST with final parse options, version persisted cache keys, invalidate stored ASTs when node contracts change, and use only narrow entry points.

### Check: Enforce bundle budgets

Expected:

```bash
pnpm run size
pnpm test -- tests/bundle-size.test.ts
```

Fail condition: Any measured entry exceeds its checked gzip budget or starts bundling a highlighter.

Fix: Inspect the bundle diff and justify any syntax or dependency cost before adjusting a budget.

## Release Checks

### Check: Run the complete package gate

Expected:

```bash
pnpm run verify
```

Fail condition: Tests, typechecking, build, docs validation, conformance accounting, sizes, benchmarks, or the npm dry run fail.

Fix: Resolve every gate before publishing, including HTML/React/Octane parity; audit raw HTML, highlighter output, HTML hooks, and component replacements separately.

## Common Production Mistakes

### CRITICAL Enabling HTML for untrusted Markdown

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderComment(source: string): string {
  return renderHtml(source, { allowHtml: true })
}
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderComment(source: string): string {
  return renderHtml(source)
}
```

`allowHtml` emits raw nodes and is not a sanitization step.

Source: `docs/core-concepts/security.md`

### HIGH Returning highlighter containers

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

function escapeCode(code: string): string {
  return code.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[character] ?? character)
}

console.log(renderHtml('```ts\nconst x = 1\n```', {
  highlighter: (code) => `<pre><code>${escapeCode(code)}</code></pre>`,
}))
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

function escapeCode(code: string): string {
  return code.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[character] ?? character)
}

console.log(renderHtml('```ts\nconst x = 1\n```', {
  highlighter: (code) => `<span class="token">${escapeCode(code)}</span>`,
}))
```

The renderer owns `<pre><code>`; the callback supplies only the code element's trusted contents.

Source: `docs/guides/syntax-highlighting.md`

### CRITICAL Trusting arbitrary highlighter output

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const source = '```html\n<img src=x onerror=alert(1)>\n```'
console.log(renderHtml(source, { highlighter: (code) => code }))
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

function escapeCode(code: string): string {
  return code.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[character] ?? character)
}

const source = '```html\n<img src=x onerror=alert(1)>\n```'
console.log(renderHtml(source, { highlighter: escapeCode }))
```

Highlighter output is inserted without further escaping in every renderer.

Source: `docs/core-concepts/security.md`

### MEDIUM Bundling highlighting into static clients

Wrong:

```tsx
import { Markdown } from '@tanstack/markdown/react'
import { tokenize } from '@tanstack/highlight'

export function Article({ source }: { source: string }) {
  return <Markdown highlighter={(code) => String(tokenize(code))}>{source}</Markdown>
}
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'
import type { CodeHighlighter } from '@tanstack/markdown'

export function renderStaticArticle(
  source: string,
  highlighter: CodeHighlighter,
): string {
  return renderHtml(source, { highlighter })
}
```

Tokenizer runtimes, grammars, and themes can outweigh Markdown parsing and should remain build-time or server-side for static content.

Source: `docs/guides/performance.md`

### CRITICAL Treating defaults as a sanitizer

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderForEveryPolicy(source: string): string {
  return renderHtml(source)
}
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderWithPolicy(
  source: string,
  sanitize: (html: string) => string,
): string {
  return sanitize(renderHtml(source))
}
```

Core escaping and protocol filtering do not enforce application-specific outbound-link, image, or final-HTML policy.

Source: `docs/core-concepts/security.md`

### HIGH Assuming complete CommonMark behavior

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderArbitraryMarkdown(source: string): string {
  return renderHtml(source)
}
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderControlledDocs(source: string): string {
  return renderHtml(source)
}
```

The package implements a documented docs/blog profile, not complete CommonMark, GFM, MDX, or arbitrary plugin behavior.

Source: `docs/core-concepts/syntax-profile.md`

### MEDIUM Reparsing unchanged content

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

export function renderRequest(source: string): string {
  return renderHtml(source)
}
```

Correct:

```ts
import type { MarkdownDocument } from '@tanstack/markdown'
import { renderHtml } from '@tanstack/markdown/html'
import { parseMarkdown } from '@tanstack/markdown/parser'

export function compile(source: string): MarkdownDocument {
  return parseMarkdown(source)
}

export function renderRequest(document: MarkdownDocument): string {
  return renderHtml(document)
}
```

String render inputs parse the complete document, while a cached `MarkdownDocument` skips that work.

Source: `docs/core-concepts/document-model.md`

### HIGH Injecting HTML into React

Wrong:

```tsx
import { renderHtml } from '@tanstack/markdown/html'

export function Article({ source }: { source: string }) {
  const html = renderHtml(source)
  return <article dangerouslySetInnerHTML={{ __html: html }} />
}
```

Correct:

```tsx
import { Markdown } from '@tanstack/markdown/react'

export function Article({ source }: { source: string }) {
  return <article><Markdown>{source}</Markdown></article>
}
```

The HTML string adds a trusted insertion boundary and bypasses React component replacement.

Source: `docs/guides/react.md`

### MEDIUM Expecting fence metadata to highlight

Wrong:

```ts
import { renderHtml } from '@tanstack/markdown/html'

const source = '```ts {1}\nconst answer = 42\n```'
console.log(renderHtml(source))
```

Correct:

```ts
import { renderHtml } from '@tanstack/markdown/html'

function escapeCode(code: string): string {
  return code.replace(/[&<>]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  })[character] ?? character)
}

const source = '```ts {1}\nconst answer = 42\n```'
console.log(renderHtml(source, { highlighter: escapeCode }))
```

Fence metadata enters the AST, but token markup requires an external highlighter.

Source: `docs/core-concepts/syntax-profile.md`

## Tensions

### Compatibility breadth versus bundle budget

Do not maximize conformance by default. Require target-corpus evidence, renderer coverage, and measured bundle cost before adding syntax.

### Rich trusted output versus untrusted-content safety

Do not enable raw HTML, extension HTML, or highlighter markup globally to solve presentation needs. Scope each trusted callback to controlled content.

### Parse-ahead performance versus option timing

Build cached ASTs with final parser options and document transforms. Keep required HTML render hooks active when rendering those cached documents.

## Pre-Deploy Summary

- [ ] Every content source is classified as trusted or untrusted.
- [ ] Raw HTML, extension HTML, and highlighter output have explicit owners.
- [ ] Application link, image, and final-sanitization policies are enforced.
- [ ] The downstream corpus passes deterministic AST and renderer checks.
- [ ] Unsupported syntax is documented rather than silently assumed.
- [ ] Stable content is parsed once with final options and versioned cache keys.
- [ ] Highlighting runs at build time or on the server where possible.
- [ ] Narrow entry points and individual extensions are used.
- [ ] Bundle budgets and HTML/React/Octane parity tests pass.
- [ ] `pnpm run verify` passes before release.

## Related Skills

- `render-markdown` for the supported profile, AST, parser options, and core HTML rendering.
- `docs-features` for docs metadata and code-fence behavior.
- `custom-extensions` for parser hooks and trusted HTML extension boundaries.
- `react-rendering` and `octane-rendering` for framework component policy and SSR parity.
