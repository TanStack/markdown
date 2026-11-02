import assert from 'node:assert/strict'
import {readFile,readdir} from 'node:fs/promises'
import {createRequire} from 'node:module'
export async function runEquivalence(apis) {
let comparisons = 0
function check(source, profile) {
  const values = apis.map(api => {
    const events = []
    let array
    const extensions = profile === 'docs' ? api.docsMarkdownExtensions() : [api.streamingMarkdownExtension()]
    if (profile === 'hooks') extensions.push({ name: 'observe-and-mutate', parseBlock(context) {
      events.push([context.index, [...context.lines], array === undefined || array === context.lines])
      array = context.lines
      if (context.index === 0 && context.lines[0] === '```mutate') context.lines[1] = 'changed <&'
    }, transformDocument(document) { events.push(['document', document.children.length]) } })
    const document = api.parseMarkdown(source, { extensions, allowHtml: false })
    return { document, html: api.renderHtml(document, { extensions }), events }
  })
  assert.deepEqual(values[1], values[0], 'Equivalent completed AST/HTML/callback trace: ' + JSON.stringify({ source, profile }))
  comparisons++
}
for (const mode of ['delete', 'replace', 'shorten', 'reentrant']) {
  const outputs = apis.map(api => {
    const nodes = [{ type: 'paragraph', children: [{ type: 'text', value: 'first' }, { type: 'text', value: '<last>' }] }, { type: 'thematicBreak' }, { type: 'thematicBreak' }]
    const events = []
    const extensions = [{ name: 'renderer-mutation', renderHtml(node, context) {
      events.push(node.type)
      if (node === nodes[0]) {
        if (mode === 'delete') { delete nodes[1]; nodes.push({ type: 'thematicBreak' }) }
        if (mode === 'shorten') nodes.length = 1
        if (mode === 'reentrant') return '(' + context.renderInline(node.children[1]) + ')'
      }
      if (mode === 'replace' && node.type === 'text' && node.value === 'first') {
        nodes[0].children[1] = { type: 'text', value: '&changed' }
        nodes[0].children.push({ type: 'text', value: 'ignored' })
      }
    } }]
    return { html: api.renderHtml({ type: 'root', children: nodes }, { extensions }), events }
  })
  assert.deepEqual(outputs[1], outputs[0], 'Renderer mutation/reentrancy: ' + mode)
  comparisons++
}
for (const mode of ['callout-title', 'footnote-anchor', 'heading-close']) {
  const outputs = apis.map(api => {
    const paragraph = { type: 'paragraph', children: [{ type: 'text', value: 'body' }] }
    const node = mode === 'callout-title' ? { type: 'callout', kind: 'note', title: 'old', children: [paragraph] } : mode === 'footnote-anchor' ? { type: 'footnotes', items: [{ id: 'n', number: 1, children: [paragraph] }] } : { type: 'heading', depth: 2, id: 'old', children: paragraph.children }
    const options = { headingAnchors: true, extensions: [{ name: 'staging', renderHtml(child, context) {
      if (child.type === 'text') {
        if (mode === 'callout-title') node.title = 'changed<&'
        if (mode === 'footnote-anchor') context.options.headingAnchors = { content: 'changed<&' }
        if (mode === 'heading-close') { node.depth = 3; node.id = 'changed' }
      }
    } }] }
    return api.renderHtml({ type: 'root', children: [node] }, options)
  })
  assert.equal(outputs[1], outputs[0], 'Renderer metadata staging: ' + mode)
  comparisons++
}
const require = createRequire(import.meta.url)
for (const example of require('commonmark-spec').tests) check(example.markdown, 'core')
const fixtures = []
for (const name of (await readdir('fixtures/benchmark')).filter(name => name.endsWith('.md'))) fixtures.push(await readFile('fixtures/benchmark/' + name, 'utf8'))
fixtures.push('```mutate\noriginal\n```\n\ntail', '[a]\n\n[^n]\n\n[a]: /late\n[^n]: note\n    continued', '\uFEFF---\r\na: b\r\n---\r\n```\r\nα<&\r\n```', 'before\n\n```\n[x]: /literal\n```\n\n[x]: /after\n[x]')
for (const source of fixtures) for (const profile of ['core', 'docs', 'hooks']) {
  for (let end = 0; end < source.length; end += 7) check(source.slice(0, end), profile)
  check(source, profile)
}
return comparisons
}
