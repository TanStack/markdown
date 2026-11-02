import { describe, expect, it } from 'vitest'
import { createStreamingHtmlRenderer } from '../src/html/streaming.js'
import { renderHtml } from '../src/html.js'
import { parseMarkdown } from '../src/parser.js'
import { streamingMarkdownExtension } from '../src/extensions/streaming.js'
import type { MarkdownExtension, MarkdownInput, RenderOptions } from '../src/types.js'

function baseline() {
  const extensions = [streamingMarkdownExtension()]
  return { reset() {}, render(input: MarkdownInput, options?: RenderOptions) {
    return renderHtml(input, options === undefined ? { extensions } : { ...options, extensions: [...extensions, ...(options.extensions ?? [])] })
  } }
}

describe('streaming HTML renderer', () => {
  it.each([
    '```ts title="example<&" {1}\nconst value = "<&"\n😀\n```\n\nAfter',
    '~~~~text\n[raw]: /literal\n[^n]: raw\n~~~\nend',
    '# Answer\n\n[ref]\n\n[^n]\n\n[ref]: /late\n[^n]: note\n    continued',
    '```\r\nline\r\n```',
    '\uFEFF```\nline',
    '  ```\n  line\n  ```',
    '```text\nα😀<&\u2028tail',
    '# \n\n- \n\n<script>unsafe</script>\n[bad](javascript:alert(1))',
  ])('matches every complete prefix of %s', source => {
    const renderer = createStreamingHtmlRenderer(), control = baseline()
    for (let end = 0; end <= source.length; end++) expect(renderer.render(source.slice(0, end))).toBe(control.render(source.slice(0, end)))
  })

  it('handles edits, reset, repeated input and document inputs', () => {
    const renderer = createStreamingHtmlRenderer(), control = baseline()
    const inputs: MarkdownInput[] = ['```\nalpha', '```\nalpha beta', '```\na', 'different', '```new\nbody', parseMarkdown('# Document'), '```new\nbody\nlast']
    for (const input of inputs) expect(renderer.render(input)).toBe(control.render(input))
    renderer.reset();control.reset()
    expect(renderer.render(inputs[0]!)).toBe(control.render(inputs[0]!))
  })

  it.each(['transform', 'parseBlock', 'render'] as const)('honors an escaped mutable profile %s delegate after default updates and reset', mode => {
    function run(factory: typeof createStreamingHtmlRenderer) {
      const renderer = factory(), events: unknown[] = []; let profile: MarkdownExtension | undefined
      renderer.render('capture', { extensions: [{ name: 'capture', transformDocument(_document, context) { profile = context.options.extensions?.[0] } }] })
      const extension = profile!
      if (mode === 'transform') {
        const delegate = extension.transformDocument!
        extension.transformDocument = (document, context) => { events.push(document.children.map(node => node.type === 'code' ? node.value : node.type)); return delegate.call(extension, document, context) }
      }
      if (mode === 'parseBlock') extension.parseBlock = context => { events.push([...context.lines]); return undefined }
      if (mode === 'render') extension.renderHtml = node => node.type === 'code' ? `<pre><code>${node.value.toUpperCase()}</code></pre>` : undefined
      const outputs = [renderer.render('```text\nalpha'), renderer.render('```text\nalpha beta')]
      renderer.reset();outputs.push(renderer.render('```text\nalpha'))
      return { events, outputs }
    }
    expect(run(createStreamingHtmlRenderer)).toEqual(run(baseline))
  })

  it('keeps options, highlighters and reentrant calls authoritative', () => {
    function run(factory: typeof createStreamingHtmlRenderer) {
      const renderer = factory(), events: string[] = []
      const options: RenderOptions = { extensions: [{ name: 'nested', renderHtml(node) { if (node.type === 'paragraph') return renderer.render('```text\nnested') } }] }
      Object.defineProperty(options, 'allowHtml', { enumerable: true, get() { events.push('allowHtml'); return false } })
      const first = renderer.render('outer', options)
      expect(() => renderer.render('```\nbody', { highlighter() { throw new Error('expected') } })).toThrow('expected')
      return { events, outputs: [first, renderer.render('```text\nnested plus')] }
    }
    expect(run(createStreamingHtmlRenderer)).toEqual(run(baseline))
  })
})
