---
title: AI Streaming
---

# AI Streaming

TanStack Markdown can render the accumulated text of a streamed AI response. Each update parses the complete string synchronously; there is no incremental parser state to coordinate or discard.

```tsx
import { streamingMarkdownExtension } from '@tanstack/markdown/extensions/streaming'
import { Markdown } from '@tanstack/markdown/react'

const streamingExtensions = [streamingMarkdownExtension()]

export function Response({ text }: { text: string }) {
  return (
    <Markdown
      extensions={streamingExtensions}
      frontmatter={false}
      headingIds={false}
    >
      {text}
    </Markdown>
  )
}
```

The streaming extension suppresses empty trailing headings, blockquotes, and list items while a response is incomplete. It does not change completed paragraphs, lists, tables, quotes, or fenced code. An unclosed code fence renders all code accumulated after its opening fence.

Keep the extension enabled after completion unless an intentionally empty final heading, quote, or list item is meaningful in your application. Without the extension, core parsing preserves those valid Markdown structures.

## Partial inline syntax

Unclosed emphasis, code spans, links, and other inline delimiters remain literal text until their closing delimiter arrives. Completing a table delimiter, list continuation, or inline construct can legitimately restructure the latest block.

The package reparses the accumulated response rather than maintaining parser state between updates. Batch very small transport tokens into normal UI updates when responses are unusually long or tokens arrive faster than the screen should repaint.

## Security

AI output is untrusted content:

- leave `allowHtml` disabled
- use only highlighters that escape source code
- apply application policies to outbound links and remote images
- use component overrides when links or images need custom behavior

Executable URL protocols are removed and raw HTML is escaped by default. The streaming extension does not relax those policies.

Disable frontmatter for AI responses so a completed closing delimiter cannot reinterpret the beginning of a response as metadata. Disabling heading IDs also avoids changing an element ID each time a streamed heading grows.

## HTML rendering

The same profile works without React:

```ts
import { streamingMarkdownExtension } from '@tanstack/markdown/extensions/streaming'
import { renderHtml } from '@tanstack/markdown/html'

const html = renderHtml(accumulatedResponse, {
  extensions: [streamingMarkdownExtension()],
  frontmatter: false,
  headingIds: false,
})
```

HTML and React output are tested for structural parity at every character boundary across representative prose, links, lists, tables, quotes, code, raw HTML, and executable URLs.
