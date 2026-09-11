import { describe, expect, it } from 'vitest'
import { classifyDocument, compareRenderedHtml, detectCorpusFeatures, locateTextDifference, renderedText } from '../scripts/audit-corpus.js'

describe('practical corpus audit', () => {
  it('detects supported, extension, and unsupported syntax outside code fences', () => {
    const features = detectCorpusFeatures(`---
title: Audit
---

# Heading

This is ***important***.

> [!NOTE]
> Body

Title
=====

<https://example.com>

[//]: # 'Example'

\`https://ignored.example\`

\`\`\`md file="guide.md"
Title
=====
\`\`\`
`)

    expect(features).toContain('frontmatter')
    expect(features).toContain('atx-heading')
    expect(features).toContain('callout')
    expect(features).toContain('combined-emphasis')
    expect(features).toContain('setext-heading')
    expect(features).toContain('angle-autolink')
    expect(features).toContain('code-metadata')
    expect(features).toContain('section-marker')
    expect(features).not.toContain('literal-autolink')
  })

  it('separates serialization, structure, and content differences', () => {
    expect(compareRenderedHtml('<p class="x">Same</p>', '<p>Same</p>')).toBe('serialization')
    expect(compareRenderedHtml('<p>Same</p>', '<div>Same</div>')).toBe('structure')
    expect(compareRenderedHtml('<p><strong>a/b</strong></p>', '<p><strong><a href="a">a</a>/<a href="b">b</a></strong></p>')).toBe('structure')
    expect(compareRenderedHtml('<ul><li><input disabled> one</li></ul>', '<ul><li><input class="task" disabled> one</li></ul>')).toBe(
      'serialization',
    )
    expect(compareRenderedHtml('<p>One</p>', '<p>Two</p>')).toBe('content')
    expect(compareRenderedHtml('<figure><figcaption>file.ts</figcaption><pre><code>Same</code></pre></figure>', '<pre><code>Same</code></pre>')).toBe(
      'structure',
    )
  })

  it('classifies legacy source edges instead of treating them as profile gaps', () => {
    expect(detectCorpusFeatures('**Trailing space **')).toContain('delimiter-edge')
    expect(detectCorpusFeatures('[--isolatedModules`](/tsconfig)')).toContain('delimiter-edge')
    expect(detectCorpusFeatures('![panel](images/2019-\n06-11-panel.png)')).toContain('multiline-link')
    expect(detectCorpusFeatures('``` &lt;quantity&gt; ::= value\n1\n```')).toContain('fence-info-edge')
    expect(detectCorpusFeatures('       1. License term')).toContain('four-space-indent')
  })

  it('classifies practical content groups', () => {
    expect(classifyDocument('docs/guide.md')).toBe('docs')
    expect(classifyDocument('src/blog/post.md')).toBe('blog')
    expect(classifyDocument('packages/core/README.md')).toBe('readme')
    expect(classifyDocument('.changeset/quiet-change.md')).toBe('changes')
    expect(classifyDocument('tests/fixtures/input.md')).toBe('fixture')
  })

  it('records a bounded excerpt around the first text difference', () => {
    expect(locateTextDifference('<p>Before actual after</p>', '<p>Before reference after</p>')).toEqual({
      actual: 'Before actual after',
      reference: 'Before reference after',
    })
  })

  it('does not mistake escaped code or metadata for HTML tags', () => {
    const code = '<pre data-meta="[[1, &quot;&lt;App /&gt;&quot;]]"><code>&lt;App /&gt;</code></pre>'
    expect(renderedText(code)).toBe('<App />')
    expect(renderedText('<p>&lt;!--literal--&gt; &amp;lt;tag&amp;gt;</p>')).toBe('<!--literal--> &lt;tag&gt;')
    expect(compareRenderedHtml(code, '<pre><code>&lt;App /&gt;</code></pre>')).not.toBe('content')
    expect(compareRenderedHtml('<code>&lt;App /&gt;</code>', '<code></code>')).toBe('content')
  })
})
