import { readdir, readFile } from 'node:fs/promises'
import { delimiter, join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { docsMarkdownExtensions } from '../src/extensions/docs.js'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

const modes = [
  { name: 'core', options: {} },
  { name: 'docs extensions', options: { extensions: docsMarkdownExtensions() } },
]

describe('repository documentation corpus', () => {
  it('renders every maintained Markdown fixture deterministically in HTML and React', async () => {
    const files = await corpusFiles()
    expect(files.length).toBeGreaterThanOrEqual(10)

    for (const file of files) {
      const source = await readFile(file, 'utf8')
      for (const mode of modes) {
        const message = `${mode.name}: ${file}`
        const document = JSON.stringify(parseMarkdown(source, mode.options))
        const html = renderHtml(source, mode.options)
        const react = renderToStaticMarkup(<Markdown {...mode.options}>{source}</Markdown>)
        expect(JSON.stringify(parseMarkdown(source, mode.options)), message).toBe(document)
        expect(renderHtml(source, mode.options), message).toBe(html)
        expect(normalizeStaticMarkup(react), message).toBe(normalizeStaticMarkup(html))
      }
    }
  })
})

async function corpusFiles(): Promise<string[]> {
  const root = process.cwd()
  const docs = (await readdir(join(root, 'docs'))).filter(file => file.endsWith('.md')).map(file => join(root, 'docs', file))
  const benchmarks = (await readdir(join(root, 'fixtures', 'benchmark')))
    .filter(file => file.endsWith('.md'))
    .map(file => join(root, 'fixtures', 'benchmark', file))
  const externalRoots = (process.env.MARKDOWN_CORPUS_DIRS ?? '').split(delimiter).filter(Boolean)
  const external = (
    await Promise.all(
      externalRoots.map(async directory =>
        (await readdir(directory, { recursive: true }))
          .filter(file => file.endsWith('.md'))
          .map(file => join(directory, file)),
      ),
    )
  ).flat()
  return [join(root, 'README.md'), ...docs, ...benchmarks, ...external]
}
