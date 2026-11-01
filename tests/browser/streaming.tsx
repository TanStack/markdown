import { createElement, useEffect, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { Markdown } from '../../src/react.js'
import type { MarkdownExtension } from '../../src/types.js'
import type { MarkdownProps } from '../../src/react.js'
import { parseMarkdown } from '../../src/parser.js'
import { streamingMarkdownExtension } from '../../src/extensions/streaming.js'

const extensions = [streamingMarkdownExtension()]

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

function HydrationReady({ children, onReady }: { children: ReactNode; onReady: () => void }) {
  useEffect(onReady, [onReady])
  return children
}

async function verifyStreamingReact() {
  const container = document.body.appendChild(document.createElement('div'))
  const root = createRoot(container)
  let checks = 0
  const render = (source: string, options: Omit<MarkdownProps, 'children'> = {}) => {
    flushSync(() => root.render(<Markdown extensions={extensions} {...options}>{source}</Markdown>))
    const expected = parseMarkdown(source).children.find(node => node.type === 'code')
    assert(expected?.type === 'code', 'Test source must contain code')
    assert(container.querySelector('pre code')?.textContent === expected.value, 'Code changed during a client update')
    checks++
  }
  const code = Array.from({ length: 100 }, (_, index) => `${index}: <safe> & "quoted" 👩🏽‍💻 é\n`).join('')
  const source = '```ts\n' + code
  render(source)
  const first = container.querySelector('code')!.firstChild!
  const text = first.textContent
  for (const suffix of ['tail', 'tail\n', 'tail\nnext', 'tail\nnext\n```', 'tail\nnext\n```\n\nAfter']) {
    render(source + suffix)
    assert(container.querySelector('code')!.firstChild === first, 'Appending code replaced settled DOM text')
    assert(first.textContent === text, 'Appending code rewrote settled DOM text')
    checks++
  }
  for (const replacement of ['```\n', '```ts\nchanged\n', '```ts\n\n\n\n\n', source.replace('0:', 'edited:'), source.slice(0, 70), source]) render(replacement)

  let customChildren: unknown
  render(source, { components: { code: ({ children }: { children: string }) => {
    customChildren = children
    return <code>{children}</code>
  } } })
  assert(customChildren === code, 'Custom code components must still receive string children')
  render(source, { highlighter: value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;') })
  render(source)
  flushSync(() => root.unmount())

  const errors: unknown[] = []
  container.innerHTML = renderToString(createElement(Markdown, { children: source, extensions }))
  const serverText = container.querySelector('code')!.firstChild
  let hydratedReady!: () => void
  const hydratedCommitted = new Promise<void>(resolve => { hydratedReady = resolve })
  const hydrationView = (value: string) => <HydrationReady onReady={hydratedReady}><Markdown extensions={extensions}>{value}</Markdown></HydrationReady>
  const hydrated = hydrateRoot(container, hydrationView(source), { onRecoverableError: error => errors.push(error) })
  await hydratedCommitted
  assert(errors.length === 0, 'Code text segmentation caused a hydration mismatch')
  assert(container.querySelector('code')!.firstChild === serverText, 'Hydration replaced the server text')
  flushSync(() => hydrated.render(hydrationView(source + 'hydrated update')))
  assert(container.querySelector('code')!.textContent === code + 'hydrated update', 'Hydrated code did not update correctly')
  flushSync(() => hydrated.unmount())
  const inlineExtensions: MarkdownExtension[] = [{ name: 'mention', inlineParser: {
    markers: '@',
    parse({ source, index, inLink }) {
      if (inLink) return
      const match = /^@([a-z]+)/.exec(source.slice(index))
      if (!match) return
      return { length: match[0].length, node: { type: 'inlineCode', value: match[1]! } }
    },
  } }]
  const inlineSource = '# @hello **@world** [@label](/safe)'
  container.innerHTML = renderToString(<Markdown extensions={inlineExtensions}>{inlineSource}</Markdown>)
  const inlineServerNode = container.querySelector('code')
  let inlineReady!: () => void
  const inlineCommitted = new Promise<void>(resolve => { inlineReady = resolve })
  const inlineView = (value: string) => <HydrationReady onReady={inlineReady}><Markdown extensions={inlineExtensions}>{value}</Markdown></HydrationReady>
  const inlineRoot = hydrateRoot(container, inlineView(inlineSource), { onRecoverableError: error => errors.push(error) })
  await inlineCommitted
  assert(errors.length === 0, 'Source inline parser hydration errors: ' + errors.map(String).join('; '))
  assert(container.querySelector('code') === inlineServerNode, 'Source inline parser replaced server markup')
  assert(container.querySelector('strong code')?.textContent === 'world', 'Inline parser did not run inside emphasis')
  assert(container.querySelector('a')?.textContent === '@label', 'Inline parser lost link-label context')
  flushSync(() => inlineRoot.render(inlineView('@hel')))
  assert(container.querySelector('code')?.textContent === 'hel', 'Inline parser did not process a partial update')
  flushSync(() => inlineRoot.render(inlineView('@hello')))
  assert(container.querySelector('code')?.textContent === 'hello', 'Inline parser did not process the completed update')
  flushSync(() => inlineRoot.unmount())
  checks += 6
  container.remove()
  return { checks: checks + 4 }
}

declare global {
  interface Window { verifyStreamingReact: typeof verifyStreamingReact }
}
window.verifyStreamingReact = verifyStreamingReact
