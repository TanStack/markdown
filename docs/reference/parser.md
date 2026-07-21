---
title: Parser
---

# Parser

The `@tanstack/markdown/parser` entry exports only the document parser and its transitive implementation.

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
```

## `parseMarkdown`

```ts
function parseMarkdown(
  markdown: string,
  options?: ParseOptions,
): MarkdownDocument
```

Normalizes and parses a complete Markdown source string into a deterministic `MarkdownDocument`.

### Options

| Option | Default | Behavior |
| --- | --- | --- |
| `allowHtml` | `false` | Recognize raw block and inline HTML nodes |
| `frontmatter` | `true` | Extract a leading `---` frontmatter block |
| `headingIds` | `true` | Generate IDs, disable them, or provide an ID function |
| `extensions` | `[]` | Run custom parser and transform hooks in array order |
| `references` | internal | Provide normalized reference definitions to nested parsing |
| `footnotes` | internal | Provide normalized footnote definitions to nested parsing |
| `footnoteOrder` | internal | Track first-reference order through nested parsing |
| `footnoteCounts` | internal | Track repeated references for back links |

The last four state fields are public so extension-driven nested parsing can preserve parser context. Ordinary calls should leave them unset.

### Result

The result always has `type: 'root'` and a `children` array. It may also include raw `frontmatter` and extension-derived `headings`.

See [Parsing](../core-concepts/parsing) for behavior and [Types](types) for complete contracts.
