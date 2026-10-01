---
title: Performance
---

# Performance

TanStack Markdown’s performance strategy is architectural: keep parsing synchronous, keep the AST simple, split entry points, and leave expensive optional work outside the core.

## Current measurements

The generated [size report](https://github.com/TanStack/markdown/blob/main/reports/sizes.md) records minified, gzip, and Brotli bytes for browser bundles built with esbuild. It includes selected-function imports and, separately, the complete namespace of each public package entry. Those profiles can have different sizes; neither predicts every application's final bundle.

Renderer measurements include the parser. Framework runtimes are externalized from their adapters, and the external-highlighter measurement uses only a callback stub. Check the report's generation date and reproduce it with `pnpm run size` when comparing a release.

The maintained benchmark records parse, pre-parsed rendering, parse-and-render, external-highlighter, and progressive AI-response paths against pinned comparison packages. Timings vary by runtime, CPU, fixture shape, and dependency version, so the generated [benchmark report](https://github.com/TanStack/markdown/blob/main/reports/benchmarks.md) is the only source of current CPU results.

Streaming cases include unfinished TypeScript fences at 4, 16, and 64 KiB, a tilde fence, and a fence that closes after 64 KiB. Every 32-character update reparses the accumulated source. The report records total replay time and per-update latency, including p50, p95, and maximum latency while the fence is open. Separate parse-only, plain HTML, and real `@tanstack/highlight` runs show how the costs change as code accumulates. These Node measurements exclude browser rendering and framework updates.

The separate [streaming library comparison](https://github.com/TanStack/markdown/blob/main/reports/streaming-browser.md) measures TanStack Markdown React, Streamdown, and streaming-markdown in headless Chrome. It keeps React roots and incremental parser state alive between chunks, checks that the growing code stays visible, and records DOM update and forced-layout latency with plain code rendering. Run it with `pnpm run bench:streaming` after installing Chromium through `pnpm exec playwright install chromium`, or use an installed Chrome with `BENCH_BROWSER_CHANNEL=chrome pnpm run bench:streaming`.

## Use the narrow entry point

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderHtml } from '@tanstack/markdown/html'
```

Avoid UI adapters outside their matching framework. Import individual extensions instead of the docs preset when only one capability is required.

## Parse ahead of rendering

For content that changes less often than it is viewed, parse during ingestion or the build. Cache the serializable AST and render it for each target. Passing an AST skips the parser on each render. The benchmark report compares that path with parsing and rendering together for each fixture.

## Keep highlighting external

Highlighting often costs more than Markdown parsing and can bring language grammars, themes, or WASM. Run it at build time or on the server when possible. The Markdown package will never import a highlighter from its core paths.

## Reproduce the reports

```bash
pnpm run size
pnpm run bench
```

Bundle budgets are also enforced in the test suite so an accidental dependency or code-size regression fails CI.
