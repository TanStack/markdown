---
title: Overview
---

# TanStack Markdown

TanStack Markdown is a small, synchronous Markdown parser and renderer built for technical blogs and documentation.

It provides independently importable paths for each layer:

- A parser that produces a deterministic, serializable AST
- An HTML renderer with safe defaults
- React and Octane renderers with the same core output semantics
- An optional profile for accumulated AI response streams

The package has no runtime dependencies. React and Octane are optional peer dependencies used only by their matching adapter entry points, and syntax highlighting stays outside the Markdown bundle.

## Why another Markdown library?

General Markdown processors optimize for broad conformance, plugin ecosystems, or content transformation pipelines. Those are valid goals, but a controlled docs site often needs much less:

- familiar prose, links, images, tables, lists, footnotes, and code fences
- deterministic server and client rendering
- explicit handling of raw HTML and executable URLs
- code metadata for documentation UI
- a small browser bundle

TanStack Markdown supports that workflow through separately importable renderers and optional docs extensions. It deliberately does not implement every CommonMark edge case, MDX evaluation, automatic linkification, or a general asynchronous processing ecosystem.

## Core properties

### Small entry points

Import the parser, HTML renderer, or matching UI adapter separately. The generated [bundle report](https://github.com/TanStack/markdown/blob/main/reports/sizes.md) records minified browser bundles with framework runtimes externalized, including both selected-function imports and complete public entry points. Reproduce it with `pnpm run size`; your application’s imports and bundler configuration determine its final size.

### Parse once, render many

`parseMarkdown` returns plain objects and arrays. The result can be serialized, cached, inspected, transformed, and passed to the HTML, React, or Octane renderer.

### Safe defaults

Raw HTML is escaped unless `allowHtml` is enabled. Executable URL protocols such as `javascript:` are removed from links and images.

### Focused compatibility

The supported contract is the [TanStack docs syntax profile](./core-concepts/syntax-profile.md), not full CommonMark or GFM. Compatibility is continuously measured so established behavior cannot regress silently.

### AI streaming without parser state

The optional [AI streaming profile](./guides/ai-streaming.md) reparses accumulated response text and suppresses incomplete trailing block placeholders. It is imported separately. Each update still parses the complete accumulated source; batch updates for long responses or very frequent transport tokens.

## Choose your starting point

- Continue to [Installation](./installation.md) for package and runtime requirements.
- Use [Quick Start](./quick-start.md) for HTML, React, and Octane examples.
- Read [Comparison](./comparison.md) to evaluate the tradeoffs.
- Review the [Syntax Profile](./core-concepts/syntax-profile.md) before migrating an existing content corpus.
