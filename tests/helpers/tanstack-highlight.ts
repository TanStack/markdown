import { createHighlighter } from '@tanstack/highlight/core'
import { html } from '@tanstack/highlight/languages/html'
import { plaintext } from '@tanstack/highlight/languages/plaintext'
import { ts } from '@tanstack/highlight/languages/ts'
import { createTanStackMarkdownHighlighter } from '@tanstack/highlight/markdown'
import type { CodeHighlighter } from '../../src/index.js'

export const tanStackHighlighter = createHighlighter({
  languages: [plaintext, html, ts],
})

export const highlightMarkdownCode: CodeHighlighter =
  createTanStackMarkdownHighlighter(tanStackHighlighter)
