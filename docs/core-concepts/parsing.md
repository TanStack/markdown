---
title: Parsing
---

# Parsing

Parsing is synchronous and deterministic:

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'

const document = parseMarkdown(source, {
  frontmatter: true,
  headingIds: true,
})
```

## Input normalization

The parser normalizes line endings before extracting frontmatter, link definitions, footnote definitions, blocks, and inline content. It does not read files, load plugins, or perform asynchronous work.

## Frontmatter

A leading `---` block is extracted by default:

```md
---
title: Small Markdown
published: true
---

# Article
```

`document.frontmatter` contains the unparsed text between delimiters. Set `frontmatter: false` to treat the input as ordinary Markdown.

## Heading IDs

Headings receive lowercase, duplicate-safe IDs by default. Disable them or provide a custom function:

```ts
parseMarkdown(source, { headingIds: false })

parseMarkdown(source, {
  headingIds(text, sourceLine) {
    return `${sourceLine}-${text.toLowerCase().replaceAll(' ', '-')}`
  },
})
```

The second callback argument is the zero-based normalized parser line index. It is not a source-location API because frontmatter and definitions may already have been extracted.

## Definitions and footnotes

Link definitions are collected before block parsing and resolved case-insensitively. Footnotes are emitted in first-reference order, with collision-safe IDs and back-reference counts.

The `references`, `footnotes`, `footnoteOrder`, and `footnoteCounts` fields in `ParseOptions` carry parser state through nested parsing. Most consumers should leave them unset.

## Extensions

Extensions may claim a block, transform inline nodes, transform the completed document, or render custom HTML. They run in array order. See [Extensions](../guides/extensions) for lifecycle and examples.

## Complexity bounds

Block recursion is capped, inline scanning uses explicit budgets, and malformed-input behavior is covered by fixed-seed fuzzing and adversarial runtime tests. Inputs beyond a parser depth limit degrade to text content instead of recursing without bound.
