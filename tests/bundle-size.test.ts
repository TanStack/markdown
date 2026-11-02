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

    // Node 24 ceilings include the bounded Unicode blockquote fix.
    // Separately imported extension ceilings are unchanged.
    for (const [result, min, gzip, brotli] of [
      [parser, 12649, 5220, 4823],
      [html, 17840, 7050, 6485],
      [react, 17848, 7001, 6478],
      [octane, 17785, 6967, 6438],
      [pluggable, 17876, 7070, 6477],
      [streaming, 699, 311, 253],
      [callouts, 506, 335, 278],
      [reactStreaming, 18540, 7186, 6623],
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
      '.': [18105, 7177, 6596],
      './html': [18065, 7164, 6582],
      './html/streaming': [19605, 7694, 7083],
      './parser': [12782, 5307, 4886],
      './react': [18048, 7111, 6563],
      './octane': [17988, 7076, 6508],
      './extensions/autolinks': [994, 632, 568],
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
