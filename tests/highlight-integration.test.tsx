import { renderToStaticMarkup } from 'react-dom/server'
import { createThemeCss } from '@tanstack/highlight/theme'
import { githubDarkTheme } from '@tanstack/highlight/themes/github-dark'
import { githubLightTheme } from '@tanstack/highlight/themes/github-light'
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/html.js'
import { Markdown } from '../src/react.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'
import { highlightMarkdownCode } from './helpers/tanstack-highlight.js'

describe('TanStack Highlight integration', () => {
  it('renders escaped inner token markup inside Markdown-owned containers', () => {
    const source = '```html {1}\n<img src=x onerror=alert(1)>\n```'
    const options = {
      codeLineNumbers: true,
      highlighter: highlightMarkdownCode,
    }
    const html = renderHtml(source, options)
    const react = renderToStaticMarkup(<Markdown {...options}>{source}</Markdown>)

    expect(html.match(/<pre/g)).toHaveLength(1)
    expect(html.match(/<code/g)).toHaveLength(1)
    expect(html).toContain('class="tm-code tm-code--line-numbers"')
    expect(html).toContain('class="th-line th-line--highlighted"')
    expect(html).toContain('&lt;')
    expect(html).not.toContain('<img')
    expect(normalizeStaticMarkup(react)).toBe(normalizeStaticMarkup(html))
  })

  it('degrades unknown languages to escaped plain text', () => {
    const html = renderHtml('```unknown\n<script>alert(1)</script>\n```', {
      highlighter: highlightMarkdownCode,
    })

    expect(html).toContain('class="language-unknown"')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it('themes Markdown-owned code containers directly', () => {
    const css = createThemeCss({
      codeBlockSelector: '.markdown-renderer pre.tm-code',
      dark: githubDarkTheme,
      darkSelector: '.dark .markdown-renderer',
      light: githubLightTheme,
      lightSelector: '.markdown-renderer',
      lineNumbersSelector: '.markdown-renderer .tm-code--line-numbers',
    })

    expect(css).toContain('.markdown-renderer pre.tm-code {')
    expect(css).toContain(
      '.markdown-renderer .tm-code--line-numbers .th-line::before',
    )
    expect(css).not.toContain('pre.th-code')
  })
})
