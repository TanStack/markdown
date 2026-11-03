import { expect, it } from 'vitest'
import { createStreamingHtmlRenderer } from '../src/html/streaming.js'
import { renderHtml } from '../src/html.js'
import { streamingMarkdownExtension } from '../src/extensions/streaming.js'

it.each([
  '# Answer\n\nHere is code.\n\n```ts title="<&"\nconst x = "<&"\nlast\n```\n\nDone',
  '```old\nfirst\n```\n\nNarrative\n\n~~~new\nsecond\n\nmore\n~~~',
  'Intro [a]\n\n[a]: /target\n\n```\n[a]\n[^n]: literal',
  'Intro[^n]\n\n[^n]: note\n\n```\nbody',
  '- item\n\n```\nbody\n\n```\nlast',
  '> quote\n\n~~~\n<& α😀\n~~~',
  '```\nbody\n\n```js\nnot a new opener',
  '<div>\n\n```\nbody',
  '---\ntitle: Example\n---\n\nNarrative\n\n```js\nbody',
  'Intro\r\n\r\n```\r\nbody',
])('preserves every complete prefix of narrative fences: %s', source => {
  const renderer = createStreamingHtmlRenderer()
  const extensions = [streamingMarkdownExtension()]
  for (let end = 0; end <= source.length; end++) {
    const prefix = source.slice(0, end)
    expect(renderer.render(prefix)).toBe(renderHtml(prefix, { extensions }))
  }
  renderer.reset()
  expect(renderer.render(source)).toBe(renderHtml(source, { extensions }))
  expect(renderer.render(source.slice(0, -3))).toBe(renderHtml(source.slice(0, -3), { extensions }))
})
