---
title: Syntax Profile
---

# Syntax Profile

TanStack Markdown implements a documented subset aimed at repository-authored blogs, guides, API documentation, changelogs, and release notes.

## Block syntax

| Syntax | Support | Notes |
| --- | :---: | --- |
| ATX headings | Yes | Levels 1-6 with stable duplicate-safe IDs |
| Paragraphs | Yes | Soft line breaks remain text line breaks |
| Fenced code blocks | Yes | Backtick and tilde fences, language and docs metadata |
| Blockquotes | Yes | Nested parsing with a bounded depth |
| Unordered lists | Yes | Tight, loose, nested, and task items |
| Ordered lists | Yes | `.` and `)` markers, custom starts, tight and loose items |
| Tables | Yes | Header delimiter and left/center/right alignment |
| Thematic breaks | Yes | Hyphen, asterisk, and underscore forms |
| Frontmatter extraction | Yes | Leading `---` block, enabled by default |
| Footnotes | Yes | Definition order follows first reference |
| Raw HTML | Opt-in | Parsed and emitted only with `allowHtml: true` |
| Setext headings | No | Use `#` headings |
| Indented code blocks | No | Use fenced code blocks |

## Inline syntax

| Syntax | Support | Notes |
| --- | :---: | --- |
| Emphasis and strong | Yes | Natural prose patterns; not every pathological delimiter case |
| Strikethrough | Yes | GFM `~~text~~` and legacy TanStack `~text~`; numeric approximations stay literal |
| Inline code | Yes | Backtick spans |
| Inline links and images | Yes | Unsafe URL protocols are removed |
| Reference links and images | Yes | Full and collapsed forms used by the maintained corpus |
| Hard breaks | Yes | Backslash before a newline |
| Raw inline HTML | Opt-in | Requires `allowHtml: true` |
| Autolink literals | No | Write an explicit link |
| Entity decoding | Partial | HTML is escaped; full CommonMark entity behavior is not a goal |

## Docs metadata

Code fences understand metadata used by technical documentation:

````md
```tsx file="app.tsx" framework="react" {2,4-6}
export function App() {
  return <main>Hello</main>
}
```
````

The AST records `lang`, `meta`, `title`, `file`, `framework`, and `highlightLines`. Rendering the metadata does not add a syntax highlighter.

## Optional docs syntax

The docs extension entry points add:

- GitHub-style callouts such as `> [!TIP]`
- heading collection for table-of-contents data
- comment-delimited component blocks
- file, package-manager, bundler, and framework transforms

See the [Docs Preset](../guides/docs-preset) guide.

## Deliberate limits

The following are not project goals:

- complete CommonMark or GFM conformance
- MDX, JSX parsing, or arbitrary code evaluation
- automatic URL linking
- a complete HTML parser or sanitizer
- every delimiter, indentation, entity, or reference-label interaction
- syntax highlighting, themes, or language grammars
- asynchronous plugin pipelines

Unsupported input must still be deterministic, escaped by default, and bounded in runtime. New syntax requires evidence from real documentation, regression fixtures, renderer parity, and an accepted bundle cost.
