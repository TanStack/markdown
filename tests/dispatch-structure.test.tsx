import { execFileSync } from 'node:child_process'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it } from 'vitest'
import { parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'

describe('shared built-in recognition', () => {
  it('consumes quote separators without losing their content or hanging', () => {
    const sources = ['>x\u2028', '>x\u2029', '> a\u2028b', '> a\u2029b', '> \u2028b', '>\u2029b']
    const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
      `import {renderHtml} from './src/html.ts'; console.log(JSON.stringify(${JSON.stringify(sources)}.map(source => renderHtml(source))))`,
    ], { encoding: 'utf8', timeout: 3000 })
    expect(JSON.parse(output)).toEqual([
      '<blockquote>\n<p>x</p>\n</blockquote>', '<blockquote>\n<p>x</p>\n</blockquote>',
      '<blockquote>\n<p>a\u2028b</p>\n</blockquote>', '<blockquote>\n<p>a\u2029b</p>\n</blockquote>',
      '<blockquote>\n<p>b</p>\n</blockquote>', '<blockquote>\n<p>b</p>\n</blockquote>',
    ])
    for (const source of sources) {
      const document = parseMarkdown(source)
      expect(renderHtml(document)).toBe(renderHtml(source))
      expect(renderToStaticMarkup(<Markdown>{source}</Markdown>)).toContain('<blockquote>')
      expect(renderOctane(OctaneMarkdown, { children: source }).html).toContain('<blockquote>')
    }
  })
})
