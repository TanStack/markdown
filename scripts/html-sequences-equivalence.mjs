import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { relative, resolve } from 'node:path'
import { build } from 'esbuild'
const baseline = 'f99165e3c6e50fc8cbc5654838c524ff4995f68f'
const directory = resolve(process.argv[2])
await mkdir(directory, { recursive: false })
const root = process.cwd()
const apis = []
const hashes = []
for (const previous of [true, false]) {
  const result = await build({ stdin: { contents: "export * from './src/index.ts'; export * from './src/extensions/streaming.ts'; export * from './src/extensions/docs.ts'", resolveDir: root, loader: 'ts' }, bundle: true, minify: true, write: false, format: 'esm', platform: 'browser', target: 'es2022', plugins: previous ? [{ name: 'frozen-baseline', setup(builder) { builder.onLoad({ filter: /\.ts$/ }, ({ path }) => {
    const name = relative(root, path)
    if (name.startsWith('src/')) return { contents: execFileSync('git', ['show', `${baseline}:${name}`], { encoding: 'utf8' }), loader: 'ts' }
  }) } }] : [] })
  const bytes = result.outputFiles[0].contents
  hashes.push(createHash('sha256').update(bytes).digest('hex'))
  await writeFile(resolve(directory, previous ? 'baseline.mjs' : 'candidate.mjs'), bytes)
  apis.push(await import('data:text/javascript;base64,' + Buffer.from(bytes).toString('base64') + '#' + previous))
}
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
const require = createRequire(import.meta.url)
for (const example of require('commonmark-spec').tests) check(example.markdown, 'core')
const fixtures = []
for (const name of (await readdir('fixtures/benchmark')).filter(name => name.endsWith('.md'))) fixtures.push(await readFile('fixtures/benchmark/' + name, 'utf8'))
fixtures.push('```mutate\noriginal\n```\n\ntail', '[a]\n\n[^n]\n\n[a]: /late\n[^n]: note\n    continued', '\uFEFF---\r\na: b\r\n---\r\n```\r\nα<&\r\n```', 'before\n\n```\n[x]: /literal\n```\n\n[x]: /after\n[x]')
for (const source of fixtures) for (const profile of ['core', 'docs', 'hooks']) {
  for (let end = 0; end < source.length; end += 7) check(source.slice(0, end), profile)
  check(source, profile)
}
await writeFile(resolve(directory, 'receipt.json'), JSON.stringify({ baseline, candidate: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), hashes, comparisons, node: process.version, claim: 'Exact completed AST, HTML and observable callback trace equality only; not timing or memory acceptance.' }, null, 2))
console.log(JSON.stringify({ comparisons, hashes }))
