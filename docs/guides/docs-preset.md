---
title: Docs Preset
---

# Docs Preset

The docs preset composes the built-in callout, comment-component, component-transform, and heading-collection extensions.

```ts
import { parseMarkdown } from '@tanstack/markdown/parser'
import { renderHtml } from '@tanstack/markdown/html'
import { docsMarkdownExtensions } from '@tanstack/markdown/extensions/docs'

const extensions = docsMarkdownExtensions()
const document = parseMarkdown(source, { extensions })
const html = renderHtml(document, {
  extensions,
  headingAnchors: true,
})
```

The preset is a separate 2.3 KB gzip entry and is not imported by the parser or renderers.

## Callouts

```md
> [!TIP] Cache the parsed document
> Rendering an AST avoids parsing the same article again.
```

This produces a `CalloutNode` and renders `markdown-alert`, `markdown-alert-title`, and `markdown-alert-content` classes.

Keep blank lines inside a callout quoted with `>`. An unquoted blank line ends the callout. Custom titles are plain text; put Markdown links in the body.

## Heading collection

Heading collection adds table-of-contents data to `document.headings`:

```ts
const document = parseMarkdown('# Guide\n\n## Install', {
  extensions: docsMarkdownExtensions(),
})

document.headings
// [
//   { id: 'guide', text: 'Guide', level: 1 },
//   { id: 'install', text: 'Install', level: 2 },
// ]
```

Disable collection with `docsMarkdownExtensions({ collectHeadings: false })`, or configure component names that should not contribute headings.

## Comment components

Single components use one HTML comment:

```md
<!-- ::separator tone="subtle" -->
```

Block components use matching start and end comments:

```md
<!-- ::start:tabs -->

## React

React content

## Solid

Solid content

<!-- ::end:tabs -->
```

Names are normalized to lowercase. Quoted, unquoted, and boolean-style attributes are supported.

## Tab variants

The preset transforms these `tabs` variants:

| Variant | Input model | Output metadata |
| --- | --- | --- |
| default | Sections divided by the shallowest heading | tab names, slugs, and `md-tab-panel` children |
| `files` | Fenced code blocks with `file=` or `title=` | file metadata and one panel per file |
| `package-manager` | Shared `package...` lines or `framework: package...` lines | package groups and install mode |
| `bundler` | Vite and Rsbuild heading sections | available bundlers and panel content |

The transforms emit custom element names and JSON `data-*` properties. Your application owns the components and behavior attached to that contract.

Package-manager lines without a framework prefix apply to every framework. Each line is a separate command, so this block supplies three commands to the application's package-manager component:

```md
<!-- ::start:tabs variant="package-manager" mode="local-install" -->

@tanstack/intent@latest list
@tanstack/intent@latest validate
@tanstack/intent@latest review

<!-- ::end:tabs -->
```

A line is a framework line when it starts with a name made of letters, digits, `_`, or `-` followed by a colon, so both `react:package` and `react: package` select the `react` group. A colon that starts a URL or path does not begin a framework prefix: `https://example.com/package.tgz`, `file:../local-package`, and `git+ssh://` specifiers are shared commands. A framework line can still install a protocol package, as in `react: file:../local-package`.

The `data-package-manager-meta` JSON keeps shared commands under the empty string key in `packagesByFramework`. This fallback group comes first. Named framework groups include shared lines in source order, so renderers can select a named group or fall back to the shared group. Framework discovery should ignore the empty key.

Use a fenced text block inside the component when command arguments contain literal Markdown characters such as `<package>#<skill>` or `*`.

## Framework panels

`framework` blocks split top-level framework headings into `md-framework-panel` elements. Nested headings receive a framework label, while top-level selector headings are omitted from collected table-of-contents data.

Use the individual [extension entry points](../reference/extensions) when the complete preset is more than your site needs.
