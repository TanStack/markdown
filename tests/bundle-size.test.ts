import { brotliCompressSync, gzipSync } from 'node:zlib'
import { build } from 'esbuild'
import { describe, expect, it } from 'vitest'
import { publicEntries } from '../scripts/measure-size.js'

describe('bundle budgets', () => {
  it('keeps parser and renderers small without bundling a highlighter', async () => {
    const parser = await bundle("import { parseMarkdown } from './src/parser.ts'; console.log(parseMarkdown)")
    const html = await bundle("import { renderHtml } from './src/html.ts'; console.log(renderHtml)")
    const react = await bundle("import { Markdown, renderMarkdownReact } from './src/react.ts'; console.log(Markdown, renderMarkdownReact)", ['react'])
    const octane = await bundle("import { Markdown, renderMarkdownOctane } from './src/octane.ts'; console.log(Markdown, renderMarkdownOctane)", ['octane'])
    const pluggable = await bundle("import { renderHtml } from './src/html.ts'; const highlighter = (code) => code; console.log(renderHtml('# x', { highlighter }))")
    const streaming = await bundle("import { streamingMarkdownExtension } from './src/extensions/streaming.ts'; console.log(streamingMarkdownExtension)")
    const callouts = await bundle("import { calloutsExtension } from './src/extensions/callouts.ts'; console.log(calloutsExtension)")
    const docs = await bundle("import { docsMarkdownExtensions } from './src/extensions/docs.ts'; console.log(docsMarkdownExtensions)")
    const tabs = await bundle("import { transformTabsComponent } from './src/extensions/tabs.ts'; console.log(transformTabsComponent)")
    const reactStreaming = await bundle(
      "import { Markdown } from './src/react.ts'; import { streamingMarkdownExtension } from './src/extensions/streaming.ts'; console.log(Markdown, streamingMarkdownExtension)",
      ['react'],
    )

    // The September 11 audited working tree is the ceiling, not the larger npm release.
    for (const [result, min, gzip, brotli] of [
      [parser, 13440, 4948, 4559],
      [html, 18453, 6737, 6169],
      [react, 18491, 6682, 6153],
      [octane, 18494, 6681, 6145],
      [pluggable, 18489, 6759, 6195],
      [streaming, 699, 311, 253],
      [callouts, 556, 372, 329],
      [reactStreaming, 19182, 6868, 6316],
      [docs, 6589, 2334, 2121],
      [tabs, 3320, 1232, 1094],
    ] as const) {
      expect(result.minBytes).toBeLessThanOrEqual(min)
      expect(result.gzipBytes).toBeLessThanOrEqual(gzip)
      expect(result.brotliBytes).toBeLessThanOrEqual(brotli)
    }
    expect(html.code).not.toContain('external-line')
  })

  it('also protects the complete namespace of every public entry point', async () => {
    const budgets: Record<string, number[]> = {
      '.': [18714, 6864, 6272],
      './html': [18676, 6845, 6267],
      './parser': [13572, 5032, 4635],
      './react': [18691, 6790, 6242],
      './octane': [18697, 6790, 6239],
      './extensions/callouts': [710, 467, 390],
      './extensions/comment-components': [1159, 656, 554],
      './extensions/docs': [6753, 2433, 2198],
      './extensions/framework': [1470, 734, 630],
      './extensions/headings': [1038, 573, 480],
      './extensions/streaming': [838, 403, 334],
      './extensions/tabs': [3567, 1350, 1197],
    }
    for (const entry of publicEntries) {
      const result = await bundle(entry.contents, entry.external)
      const budget = budgets[entry.name]!
      expect(budget, entry.name).toBeDefined()
      expect(result.minBytes, entry.name).toBeLessThanOrEqual(budget[0]!)
      expect(result.gzipBytes, entry.name).toBeLessThanOrEqual(budget[1]!)
      expect(result.brotliBytes, entry.name).toBeLessThanOrEqual(budget[2]!)
    }
  })
})

async function bundle(contents: string, external: string[] = []) {
  const output = await build({
    stdin: {
      contents,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    minify: true,
    treeShaking: true,
    platform: 'browser',
    format: 'esm',
    target: 'es2022',
    external,
    logLevel: 'silent',
  })

  const code = Buffer.from(output.outputFiles[0]!.contents).toString('utf8')
  return {
    code,
    minBytes: Buffer.byteLength(code),
    gzipBytes: gzipSync(code, { level: 9 }).length,
    brotliBytes: brotliCompressSync(code).length,
  }
}
