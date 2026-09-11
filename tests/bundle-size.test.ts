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

    // Measured ceilings for the #7, #9, and #11 fixes, with no spare headroom.
    // Extension entries retain their 0.0.14 ceilings.
    for (const [result, min, gzip, brotli] of [
      [parser, 13157, 4975, 4593],
      [html, 18337, 6807, 6240],
      [react, 18271, 6722, 6184],
      [octane, 18283, 6727, 6194],
      [pluggable, 18373, 6829, 6260],
      [streaming, 699, 311, 253],
      [callouts, 506, 335, 278],
      [reactStreaming, 18962, 6907, 6356],
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
      '.': [18598, 6936, 6345],
      './html': [18560, 6920, 6331],
      './parser': [13289, 5061, 4664],
      './react': [18470, 6828, 6279],
      './octane': [18485, 6833, 6287],
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
