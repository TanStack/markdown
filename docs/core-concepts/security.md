---
title: Security
---

# Security

TanStack Markdown has safe defaults, but it is not a general HTML sanitizer.

## Default policy

By default:

- raw block and inline HTML is escaped
- `javascript:`, `vbscript:`, `file:`, and dangerous `data:` URLs are removed
- text, attributes, code, link titles, and image alt text are escaped by the HTML renderer
- React and Octane render ordinary values rather than injecting HTML

Relative URLs, fragments, HTTP, HTTPS, email, and telephone links remain available. Other explicit protocols, including `data:`, are removed.

## Raw HTML

`allowHtml: true` is an explicit trusted-content boundary:

```ts
renderHtml(source, { allowHtml: true })
```

The HTML renderer emits raw nodes directly. The React and Octane renderers use `dangerouslySetInnerHTML`. Do not enable this option for untrusted user content unless the result is sanitized with a policy appropriate for your application.

## Syntax highlighters

A `highlighter` returns HTML that is inserted into `<code>` without further escaping:

```ts
renderHtml(source, { highlighter })
```

Only use a highlighter that escapes source code and returns trusted markup. TanStack Markdown cannot distinguish token markup from an injection in the returned string.

The tested [TanStack Highlight adapter](../guides/syntax-highlighting#tanstack-highlight-adapter) returns escaped inner token markup without duplicating Markdown's `<pre><code>` containers.

## Extensions

An extension `renderHtml` hook also returns trusted HTML. React and Octane component replacements can enforce application-specific link, image, and navigation policies, but those replacements are outside core renderer parity.

## Document ASTs

Renderers trust document ASTs supplied directly by the application. URL screening happens during Markdown parsing, not when rendering an arbitrary link or image node. Do not accept untrusted JSON as a document AST without validating its structure and applying your URL and HTML policies.

## Resource limits

The core limits parser nesting and inline delimiter scans. These are not a limit on total input size, footnote count, or work performed by extensions. Bound untrusted document sizes in the application, and batch streaming updates instead of rerendering on every incoming character.

## Untrusted content

For user-generated Markdown:

1. Keep `allowHtml` disabled.
2. Do not install extensions that emit unsanitized HTML.
3. Audit or sanitize highlighter output.
4. Apply application policies for outbound links and remote images.
5. Sanitize the final HTML when your threat model requires an independent defense layer.

The security regression suite covers executable protocols, raw HTML opt-in behavior, escaping, and framework renderer handling.
