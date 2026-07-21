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
- React renders ordinary values rather than injecting HTML

Relative URLs, fragments, HTTP, HTTPS, email, and telephone links remain available. Other explicit protocols, including `data:`, are removed.

## Raw HTML

`allowHtml: true` is an explicit trusted-content boundary:

```ts
renderHtml(source, { allowHtml: true })
```

The HTML renderer emits raw nodes directly. The React renderer uses `dangerouslySetInnerHTML`. Do not enable this option for untrusted user content unless the result is sanitized with a policy appropriate for your application.

## Syntax highlighters

A `highlighter` returns HTML that is inserted into `<code>` without further escaping:

```ts
renderHtml(source, { highlighter })
```

Only use a highlighter that escapes source code and returns trusted markup. TanStack Markdown cannot distinguish token markup from an injection in the returned string.

## Extensions

An extension `renderHtml` hook also returns trusted HTML. React component replacements can enforce application-specific link, image, and navigation policies, but those replacements are outside core renderer parity.

## Untrusted content

For user-generated Markdown:

1. Keep `allowHtml` disabled.
2. Do not install extensions that emit unsanitized HTML.
3. Audit or sanitize highlighter output.
4. Apply application policies for outbound links and remote images.
5. Sanitize the final HTML when your threat model requires an independent defense layer.

The security regression suite covers executable protocols, raw HTML opt-in behavior, escaping, and React/HTML handling.
