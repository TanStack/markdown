// @ts-nocheck
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { build } from 'esbuild'

const reportsDir = join(process.cwd(), 'reports')

const entries = [
  {
    group: 'tanstack',
    name: 'parser only',
    contents: "import { parseMarkdown } from './src/parser.ts'; console.log(parseMarkdown)",
  },
  {
    group: 'tanstack',
    name: 'html renderer no highlighter',
    contents: "import { renderHtml } from './src/html.ts'; console.log(renderHtml)",
  },
  {
    group: 'tanstack',
    name: 'html renderer with external highlighter stub',
    contents: "import { renderHtml } from './src/html.ts'; const highlighter = (code) => code; console.log(renderHtml('# x', { highlighter }))",
  },
  {
    group: 'tanstack',
    name: 'react adapter',
    external: ['react'],
    contents: "import { Markdown, renderMarkdownReact } from './src/react.ts'; console.log(Markdown, renderMarkdownReact)",
  },
  {
    group: 'tanstack',
    name: 'docs extension preset',
    contents: "import { docsMarkdownExtensions } from './src/extensions/docs.ts'; console.log(docsMarkdownExtensions)",
  },
  {
    group: 'tanstack',
    name: 'callouts extension',
    contents: "import { calloutsExtension } from './src/extensions/callouts.ts'; console.log(calloutsExtension)",
  },
  {
    group: 'tanstack',
    name: 'tabs transforms',
    contents: "import { transformTabsComponent } from './src/extensions/tabs.ts'; console.log(transformTabsComponent)",
  },
  {
    group: 'markdown',
    name: 'marked',
    contents: "import { marked } from 'marked'; console.log(marked)",
  },
  {
    group: 'markdown',
    name: 'markdown-it',
    contents: "import MarkdownIt from 'markdown-it'; console.log(MarkdownIt)",
  },
  {
    group: 'markdown',
    name: 'micromark',
    contents: "import { micromark } from 'micromark'; console.log(micromark)",
  },
  {
    group: 'markdown',
    name: 'commonmark',
    contents: "import * as commonmark from 'commonmark'; console.log(commonmark)",
  },
  {
    group: 'markdown',
    name: 'markdown-wasm browser js+wasm',
    files: ['node_modules/markdown-wasm/dist/markdown.js', 'node_modules/markdown-wasm/dist/markdown.wasm'],
  },
  {
    group: 'markdown',
    name: 'unified remark+rehype',
    contents: "import { unified } from 'unified'; import remarkParse from 'remark-parse'; import remarkRehype from 'remark-rehype'; import rehypeStringify from 'rehype-stringify'; console.log(unified, remarkParse, remarkRehype, rehypeStringify)",
  },
]

async function main() {
  await mkdir(reportsDir, { recursive: true })

  const results = []
  for (const entry of entries) {
    try {
      if (entry.files) {
        const files = await Promise.all(entry.files.map(file => readFile(join(process.cwd(), file))))
        const code = Buffer.concat(files)
        results.push({
          group: entry.group,
          name: entry.name,
          minBytes: code.length,
          gzipBytes: gzipSync(code, { level: 9 }).length,
          brotliBytes: brotliCompressSync(code).length,
        })
        continue
      }

      const output = await build({
        stdin: {
          contents: entry.contents,
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
        external: entry.external ?? [],
        loader: {
          '.wasm': 'binary',
        },
        logLevel: 'silent',
      })

      const code = output.outputFiles[0].contents
      results.push({
        group: entry.group,
        name: entry.name,
        minBytes: code.length,
        gzipBytes: gzipSync(code, { level: 9 }).length,
        brotliBytes: brotliCompressSync(code).length,
      })
    } catch (error) {
      results.push({
        group: entry.group,
        name: entry.name,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  await writeFile(join(reportsDir, 'sizes.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2))
  await writeFile(join(reportsDir, 'sizes.md'), renderSizeReport(results))
}

function renderSizeReport(results) {
  const lines = [
    '# Bundle Size Results',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Bundles are ESM, browser-targeted, minified with esbuild, then gzip and brotli compressed. React is externalized for the React adapter.',
    '',
    '| Group | Entry | Min bytes | Gzip bytes | Brotli bytes |',
    '| :--- | :--- | ---: | ---: | ---: |',
  ]

  for (const result of results) {
    if (result.error) {
      lines.push(`| ${result.group} | ${result.name} | error | error | error |`)
    } else {
      lines.push(`| ${result.group} | ${result.name} | ${result.minBytes} | ${result.gzipBytes} | ${result.brotliBytes} |`)
    }
  }

  lines.push('')
  return lines.join('\n')
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
