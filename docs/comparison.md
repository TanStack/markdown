---
title: Comparison
---

# Comparison

Markdown libraries optimize for different jobs. TanStack Markdown is designed for controlled blog and documentation content where bundle size, deterministic rendering, and HTML/React parity matter more than complete syntax compatibility.

## Decision table

| Choose | Best fit | Main tradeoff |
| --- | --- | --- |
| **TanStack Markdown** | Blogs and docs with a known syntax profile, SSR, React, and strict bundle budgets | Deliberately incomplete CommonMark/GFM coverage and a small extension surface |
| **Marked** | A compact general HTML renderer with broad familiar Markdown behavior | No built-in React AST renderer or docs-specific AST contract |
| **markdown-it** | Mature plugins and configurable parsing rules | A substantially larger core for this measured use case |
| **micromark** | Standards-oriented tokenization and extension building blocks | Lower-level API and more assembly for a complete docs renderer |
| **commonmark.js** | Applications that prioritize CommonMark behavior and an inspectable syntax tree | Larger bundle and no built-in React renderer |
| **unified / remark / rehype** | Rich syntax-tree transformations and a broad content-processing ecosystem | More packages, configuration, and runtime surface |
| **markdown-wasm** | Very fast HTML rendering where a WASM asset is acceptable | Different deployment model and no built-in React AST renderer |

## Capability matrix

| Capability | TanStack Markdown | Marked | markdown-it | micromark | commonmark.js | unified stack |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| HTML rendering | Built in | Built in | Built in | Built in | Built in | Via rehype |
| React renderer from the same AST | Built in | No | No | No | No | Ecosystem |
| Serializable public document AST | Built in | Token output | Token stream | No syntax tree | Built in | Built in |
| Raw HTML disabled by default | Yes | No | Yes | Yes | No | Pipeline choice |
| GFM tables, tasks, and strike | Focused built-ins | Built in | Built in/plugins | Extensions | No | Plugins |
| Docs callouts, tabs, and code metadata | Opt-in built-ins | Plugins/custom | Plugins/custom | Custom | Custom | Plugins/custom |
| General plugin ecosystem | Focused hooks | Mature | Mature | Composable extensions | Small | Extensive |
| MDX or JSX evaluation | No | No | No | No | No | Separate MDX stack |
| Full compatibility as a project goal | No | Broad compatibility | Broad compatibility | CommonMark | CommonMark | CommonMark plus plugins |

“Configuration,” “plugin,” and “ecosystem” do not imply missing capability. They indicate that the behavior is not the default contract of the compared entry point.

## Measured browser size

These repository benchmarks bundle representative browser entry points from pinned dependencies, minify them with esbuild, and compress them. They are reproducible with `pnpm run size`.

| Entry | Gzip | Brotli |
| --- | ---: | ---: |
| `@tanstack/markdown/parser` | 4.6 KB | 4.2 KB |
| `@tanstack/markdown/html` | 6.4 KB | 5.8 KB |
| `@tanstack/markdown/react` | 6.3 KB | 5.8 KB |
| Marked | 12.5 KB | 11.5 KB |
| micromark | 15.4 KB | 13.7 KB |
| markdown-wasm JS + WASM | 31.3 KB | 26.4 KB |
| unified + remark + rehype | 36.8 KB | 32.7 KB |
| commonmark.js | 48.1 KB | 39.8 KB |
| markdown-it | 52.7 KB | 44.0 KB |

The comparison does not represent equivalent feature sets. It shows the cost of each measured path for this repository’s rendering benchmark. See the generated [size report](../reports/sizes.md) for exact bytes and versions.

## Compatibility accounting

TanStack Markdown currently matches 287 of 652 CommonMark 0.31.2 examples after serializer normalization. That 44% figure is an accounting baseline, not a conformance claim or a target to maximize. The project also preserves selected official GFM examples for tables, task lists, and strikethrough.

Use [commonmark.js](https://github.com/commonmark/commonmark.js), micromark, or a unified pipeline when exact specification behavior is a requirement. Use TanStack Markdown when your corpus fits the [documented profile](core-concepts/syntax-profile) and the smaller, controlled renderer is the better product tradeoff.

## Performance

Across the maintained fixtures, TanStack Markdown is competitive with the JavaScript renderers in the suite, but it is not the fastest result in every fixture. Pre-parsed AST rendering is its cheapest path. The defensible advantage is the combined size, output contract, and focused feature set. See [Performance](guides/performance) for methodology and current results.
