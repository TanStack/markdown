---
title: API Index
---

# API Index

TanStack Markdown uses explicit subpath exports so applications can import only the parser, renderer, adapter, or extension they need.

| Package entry | Contents |
| --- | --- |
| `@tanstack/markdown` | parser, inline parser, HTML renderer, and all shared types |
| `@tanstack/markdown/parser` | `parseMarkdown` only |
| `@tanstack/markdown/html` | HTML rendering functions |
| `@tanstack/markdown/react` | React component and React rendering functions |
| `@tanstack/markdown/octane` | Octane component and descriptor rendering functions |
| `@tanstack/markdown/extensions/callouts` | callout block parser |
| `@tanstack/markdown/extensions/comment-components` | comment-delimited component parser |
| `@tanstack/markdown/extensions/docs` | composed docs extension preset |
| `@tanstack/markdown/extensions/framework` | framework component transform |
| `@tanstack/markdown/extensions/headings` | heading collection transform |
| `@tanstack/markdown/extensions/streaming` | incomplete-response placeholder transform |
| `@tanstack/markdown/extensions/tabs` | tab component transforms |

## Reference pages

- [Default Entry](default-entry)
- [Parser](parser)
- [HTML](html)
- [React](react)
- [Octane](octane)
- [Types](types)
- [Extensions](extensions)

Prefer narrow entry points in application code. The default entry is convenient when parser, HTML renderer, and public types are used together.
