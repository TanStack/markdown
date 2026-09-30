import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

// Install the actual archive in a clean consumer, not workspace source aliases.
const directory = await mkdtemp(join(tmpdir(), 'markdown-consumer-'))
const run = (command, args, cwd = directory) => execFileSync(command, args, { cwd, stdio: 'inherit' })
try {
  const manifest = JSON.parse(await readFile('package.json', 'utf8'))
  run('pnpm', ['pack', '--out', join(directory, 'markdown.tgz')], process.cwd())
  await writeFile(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }))
  const react = process.env.TEST_REACT_VERSION || '19'
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--legacy-peer-deps=false', 'typescript@5.9.3', `@types/react@${react.startsWith('18') ? '18' : '19'}`, './markdown.tgz', `react@${react}`, `react-dom@${react}`, ...(react.startsWith('18') ? [] : ['octane@0.1.12'])])
  await writeFile(join(directory, 'verify.mjs'), `
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Markdown } from '@tanstack/markdown/react'
import { parseMarkdown, renderHtml } from '@tanstack/markdown'
for (const entry of ${JSON.stringify(Object.keys(manifest.exports).filter(entry => !react.startsWith('18') || entry !== './octane'))}) {
  await import('@tanstack/markdown' + (entry === '.' ? '' : entry.slice(1)))
}
const source = '# Hello\\n\\n**world** and [unsafe](javascript:alert(1))'
const ast = JSON.parse(JSON.stringify(parseMarkdown(source)))
assert.equal(renderHtml(ast), renderHtml(source))
assert.match(renderToStaticMarkup(createElement(Markdown, { children: ast })), /<strong>world<\\/strong>/)
assert.ok(!renderHtml(source).includes('javascript:'))
${react.startsWith('18') ? '' : `const { renderToStaticMarkup: renderOctane } = await import('octane/server')
const { Markdown: OctaneMarkdown } = await import('@tanstack/markdown/octane')
assert.match(renderOctane(OctaneMarkdown, { children: ast }).html, /<strong>world<\\/strong>/)`}
console.log('Packed exports, serialized AST, React SSR, and safe URLs passed')
`)
  run(process.execPath, ['verify.mjs'])
  await writeFile(join(directory, 'verify.ts'), `import { parseMarkdown, renderHtml, type MarkdownDocument } from '@tanstack/markdown'; import { Markdown, type MarkdownProps } from '@tanstack/markdown/react'; const document: MarkdownDocument = parseMarkdown('# Typed'); const props: MarkdownProps = { children: document }; renderHtml(document); void Markdown; void props;`)
  run(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', 'verify.ts'])
} finally {
  await rm(directory, { recursive: true, force: true })
}
