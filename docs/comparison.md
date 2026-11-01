---
title: Comparison
---

# Comparison

Markdown libraries optimize for different jobs. TanStack Markdown is designed for controlled blog and documentation content where bundle size, deterministic rendering, and HTML/framework parity matter more than complete syntax compatibility.

## Decision table

| Choose | Best fit | Main tradeoff |
| --- | --- | --- |
| **TanStack Markdown** | Blogs and docs with a known syntax profile, SSR, React or Octane, and strict bundle budgets | Deliberately incomplete CommonMark/GFM coverage and a small extension surface |
| **Marked** | A compact general HTML renderer with broad familiar Markdown behavior | No built-in UI adapter over a docs-specific AST contract |
| **markdown-it** | Mature plugins and configurable parsing rules | A substantially larger core for this measured use case |
| **micromark** | Standards-oriented tokenization and extension building blocks | Lower-level API and more assembly for a complete docs renderer |
| **commonmark.js** | Applications that prioritize CommonMark behavior and an inspectable syntax tree | Larger bundle and no built-in UI framework adapter |
| **unified / remark / rehype** | Rich syntax-tree transformations and a broad content-processing ecosystem | More packages, configuration, and runtime surface |
| **markdown-wasm** | Very fast HTML rendering where a WASM asset is acceptable | Different deployment model and no built-in UI framework adapter |

## Capability matrix

| Capability | TanStack Markdown | Marked | markdown-it | micromark | commonmark.js | unified stack |
| --- | :---: | :---: | :---: | :---: | :---: | :---: |
| HTML rendering | Built in | Built in | Built in | Built in | Built in | Via rehype |
| React and Octane renderers from the same AST | Built in | No | No | No | No | Ecosystem |
| Serializable public document AST | Built in | Token output | Token stream | No syntax tree | Built in | Built in |
| Raw HTML disabled by default | Yes | No | Yes | Yes | No | Pipeline choice |
| GFM tables, tasks, and strike | Focused built-ins | Built in | Built in/plugins | Extensions | No | Plugins |
| Docs callouts, tabs, and code metadata | Opt-in built-ins | Plugins/custom | Plugins/custom | Custom | Custom | Plugins/custom |
| General plugin ecosystem | Focused hooks | Mature | Mature | Composable extensions | Small | Extensive |
| MDX or JSX evaluation | No | No | No | No | No | Separate MDX stack |
| Full compatibility as a project goal | No | Broad compatibility | Broad compatibility | CommonMark | CommonMark | CommonMark plus plugins |

“Configuration,” “plugin,” and “ecosystem” do not imply missing capability. They indicate that the behavior is not the default contract of the compared entry point.

## Measured browser size

The repository's [generated size report](https://github.com/TanStack/markdown/blob/main/reports/sizes.md) bundles representative browser entry points from pinned dependencies, minifies them with esbuild, and records gzip and Brotli bytes. Reproduce it with `pnpm run size`.

The report distinguishes selected-function imports from the complete namespace of every TanStack Markdown public entry. Framework runtimes are externalized from adapter measurements. Comparison packages have different feature sets, so the results describe those import profiles rather than equivalent capabilities or the final size of your application.

## Compatibility accounting

The generated [compatibility report](https://github.com/TanStack/markdown/blob/main/reports/conformance.md) tracks matches against all 652 CommonMark 0.31.2 examples after serializer normalization. Every established match is protected individually by the regression suite. The count is accounting, not a conformance claim or a target to maximize. Selected official GFM examples separately cover tables, task lists, and strikethrough.

Use [commonmark.js](https://github.com/commonmark/commonmark.js), micromark, or a unified pipeline when exact specification behavior is a requirement. Use TanStack Markdown when your corpus fits the [documented profile](./core-concepts/syntax-profile.md) and the smaller, controlled renderer is the better product tradeoff.

## Performance

Across the maintained fixtures, TanStack Markdown is competitive with the JavaScript renderers in the suite, but it is not the fastest result in every fixture. Pre-parsed AST rendering is its cheapest path. Compare the measured import sizes and supported syntax with the rendering and extension APIs your application needs. See [Performance](./guides/performance.md) for methodology and current results.
