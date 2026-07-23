import { gzipSync } from 'node:zlib'
import { build } from 'esbuild'
import { describe, expect, it } from 'vitest'

describe('bundle budgets', () => {
  it('keeps parser and renderers small without bundling a highlighter', async () => {
    const parser = await bundle("import { parseMarkdown } from './src/parser.ts'; console.log(parseMarkdown)")
    const html = await bundle("import { renderHtml } from './src/html.ts'; console.log(renderHtml)")
    const react = await bundle("import { Markdown } from './src/react.ts'; console.log(Markdown)", ['react'])
    const octane = await bundle("import { Markdown } from './src/octane.ts'; console.log(Markdown)", ['octane'])
    const pluggable = await bundle("import { renderHtml } from './src/html.ts'; const highlighter = (code) => code; console.log(renderHtml('# x', { highlighter }))")
    const streaming = await bundle("import { streamingMarkdownExtension } from './src/extensions/streaming.ts'; console.log(streamingMarkdownExtension)")
    const reactStreaming = await bundle(
      "import { Markdown } from './src/react.ts'; import { streamingMarkdownExtension } from './src/extensions/streaming.ts'; console.log(Markdown, streamingMarkdownExtension)",
      ['react'],
    )

    expect(parser.gzipBytes).toBeLessThan(4_975)
    expect(html.gzipBytes).toBeLessThan(6_775)
    expect(react.gzipBytes).toBeLessThan(6_700)
    expect(octane.gzipBytes).toBeLessThan(6_700)
    expect(pluggable.gzipBytes).toBeLessThan(6_800)
    expect(streaming.gzipBytes).toBeLessThan(400)
    expect(reactStreaming.gzipBytes).toBeLessThan(7_000)
    expect(html.code).not.toContain('external-line')
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
    gzipBytes: gzipSync(code, { level: 9 }).length,
  }
}
