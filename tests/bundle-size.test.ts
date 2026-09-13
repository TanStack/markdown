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

    // Measured ceilings after the streaming layout optimization, with no spare headroom.
    // Extension entries retain their 0.0.14 ceilings.
    for (const [result, min, gzip, brotli] of [
      [parser, 11949, 4894, 4539],
      [html, 17139, 6729, 6158],
      [react, 17147, 6676, 6170],
      [octane, 17084, 6644, 6143],
      [pluggable, 17175, 6751, 6184],
      [streaming, 699, 311, 253],
      [callouts, 506, 335, 278],
      [reactStreaming, 17839, 6860, 6302],
      [docs, 6423, 2292, 2073],
      [tabs, 3290, 1221, 1082],
    ] as const) {
      expect(result.minBytes).toBeLessThanOrEqual(min)
      expect(result.gzipBytes).toBeLessThanOrEqual(gzip)
      expect(result.brotliBytes).toBeLessThanOrEqual(brotli)
    }
    expect(html.code).not.toContain('external-line')
  })

  it('also protects the complete namespace of every public entry point', async () => {
    const budgets: Record<string, number[]> = {
      '.': [17404, 6852, 6267],
      './html': [17364, 6840, 6283],
      './parser': [12082, 4981, 4599],
      './react': [17347, 6790, 6241],
      './octane': [17287, 6752, 6209],
      './extensions/callouts': [660, 432, 360],
      './extensions/comment-components': [1073, 647, 542],
      './extensions/docs': [6587, 2392, 2162],
      './extensions/framework': [1470, 734, 630],
      './extensions/headings': [1038, 573, 480],
      './extensions/streaming': [838, 403, 334],
      './extensions/tabs': [3537, 1338, 1185],
    }
    expect(publicEntries.map(entry => entry.name).sort()).toEqual(Object.keys(budgets).sort())
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
