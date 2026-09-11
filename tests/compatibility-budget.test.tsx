import { execFileSync } from 'node:child_process'
import { renderToStaticMarkup } from 'react-dom/server'
import { renderToStaticMarkup as renderOctane } from 'octane/server'
import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown, renderHtml } from '../src/index.js'
import { Markdown } from '../src/react.js'
import { Markdown as OctaneMarkdown } from '../src/octane.js'
import { commentComponentsExtension, parseCommentComponentBlock, parseComponentComment } from '../src/extensions/comment-components.js'
import { docsMarkdownExtensions } from '../src/extensions/docs.js'
import type { BlockNode, BlockParseContext, MarkdownInput } from '../src/types.js'
import { normalizeStaticMarkup } from './helpers/normalize-html.js'

function equivalent(input: MarkdownInput) {
  const html = renderHtml(input)
  expect(normalizeStaticMarkup(renderToStaticMarkup(<Markdown>{input}</Markdown>))).toBe(normalizeStaticMarkup(html))
  expect(normalizeStaticMarkup(renderOctane(OctaneMarkdown, { children: input }).html)).toBe(normalizeStaticMarkup(html))
  return html
}

describe('compatibility within the audited bundle budget', () => {
  it.each(['[empty]()', '[empty]( )', '[empty](<>)', '[empty][ref]\n\n[ref]: <>'])('preserves an empty destination in %j', source => {
    expect(equivalent(source)).toBe('<p><a href="">empty</a></p>')
  })

  it.each([
    ['"double quoted"', 'double quoted'],
    ["'single quoted'", 'single quoted'],
    ['(parenthesized)', 'parenthesized'],
    ['"one\'s title"', "one's title"],
    ["'a \"quoted\" title'", 'a "quoted" title'],
  ])('shares destination parsing for inline and reference titles %s', (title, expected) => {
    const inline = `[label](/target ${title})`
    const reference = `[label][ref]\n\n[ref]: /target ${title}`
    expect(equivalent(inline)).toBe(equivalent(reference))
    expect(parseMarkdown(inline).children[0]).toMatchObject({ children: [{ type: 'link', href: '/target', title: expected }] })
  })

  it.each(['[label](/not a url)', '[label](foo\nbar)', '[label](/url "mismatched\')', '[label](/url "title "and" title")'])('keeps invalid destinations literal in %j', source => {
    expect(parseInline(source)).toEqual([{ type: 'text', value: source }])
    equivalent(source)
  })

  it.each([
    [String.raw`\(foo\)`, '(foo)'],
    [String.raw`foo\(and\(bar\)`, 'foo(and(bar)'],
    [String.raw`foo\)\:`, 'foo):'],
    [String.raw`/path\#part`, '/path#part'],
    [String.raw`/path\z`, String.raw`/path\z`],
  ])('unescapes only punctuation in destination %s', (destination, href) => {
    const source = `[label](${destination})`
    expect(parseInline(source)).toEqual([{ type: 'link', href, children: [{ type: 'text', value: 'label' }] }])
    expect(equivalent(source)).toBe(equivalent(`[label][ref]\n\n[ref]: ${destination}`))
  })

  it.each(['javascript\\:alert(1)', 'data\\:text/html,evil', 'vbscript\\:evil'])('still rejects executable protocols after unescaping %s', destination => {
    expect(equivalent(`[label](${destination})`)).toBe('<p>label</p>')
    expect(equivalent(`[label][ref]\n\n[ref]: ${destination}`)).toBe('<p>label</p>')
  })

  it.each([
    ['[outer [inner](/i)](/o)', '<p>[outer <a href="/i">inner</a>](/o)</p>'],
    ['[outer **[inner](/i)**](/o)', '<p>[outer <strong><a href="/i">inner</a></strong>](/o)</p>'],
    ['[outer [inner][i]][o]\n\n[i]: /i\n[o]: /o', '<p>[outer <a href="/i">inner</a>]<a href="/o">o</a></p>'],
    ['[outer [inner](/i)](**tail**)', '<p>[outer <a href="/i">inner</a>](<strong>tail</strong>)</p>'],
    ['[![alt [inner](/i)](/image)](/o)', '<p><a href="/o"><img src="/image" alt="alt inner"></a></p>'],
    ['[outer `code` and \\[text\\]](/o)', '<p><a href="/o">outer <code>code</code> and [text]</a></p>'],
  ])('resolves link nesting in %j', (source, expected) => {
    expect(equivalent(source)).toBe(expected)
  })

  it('does not put a footnote anchor inside a link anchor', () => {
    expect(equivalent('[label[^n]](/outer)\n\n[^n]: Note')).not.toContain('href="/outer"')
  })

  it.each(['- outer\n  - inner\n\n  - second\n- next', '1. outer\n   - inner\n\n   - second\n2. next'])('keeps looseness with the nested list in %j', source => {
    const document = parseMarkdown(source)
    expect(document.children[0]).not.toHaveProperty('loose')
    expect(document.children[0]).toMatchObject({ items: [{ children: [{ type: 'paragraph' }, { type: 'list', loose: true }] }, { children: [{ type: 'paragraph' }] }] })
    const html = equivalent(source)
    expect(html).toContain('<li>outer\n')
    expect(html).toContain('<li><p>inner</p></li>')
    expect(html).toContain('<li>next</li>')
  })

  it('keeps paragraph separation and task labels in loose outer lists', () => {
    expect(equivalent('- [x] First\n\n  Second paragraph\n- Next')).toBe('<ul>\n<li><p><input type="checkbox" disabled checked> First</p>\n<p>Second paragraph</p></li>\n<li><p>Next</p></li>\n</ul>')
  })

  it('preserves blank lines and indentation inside list code blocks without loosening the list', () => {
    const source = '- first\n- ```\n  code\n\n\n  ```\n- last'
    const document = parseMarkdown(source)
    expect(document.children[0]).not.toHaveProperty('loose')
    expect(document.children[0]).toMatchObject({ items: [{}, { children: [{ type: 'code', value: 'code\n\n' }] }, {}] })
    equivalent(source)
  })

  it.each([1, 2, 3])('removes up to %i fence-indent spaces from code lines', indent => {
    const pad = ' '.repeat(indent)
    const source = `${pad}\`\`\`\n${pad}code\n${pad}  nested\nunindented\n${pad}\`\`\``
    expect(parseMarkdown(source).children).toMatchObject([{ type: 'code', value: 'code\n  nested\nunindented' }])
    equivalent(source)
  })

  it('preserves existing quote grouping while retaining paragraph separation', () => {
    expect(equivalent('> First\n\n> Second')).toBe('<blockquote>\n<p>First</p>\n<p>Second</p>\n</blockquote>')
    expect(equivalent('> First\n>\n> Second')).toBe('<blockquote>\n<p>First</p>\n<p>Second</p>\n</blockquote>')
    expect(parseMarkdown('- > Quote\n\n  Paragraph\n- Next').children[0]).toMatchObject({ type: 'list', loose: true })
  })

  it('keeps callout boundaries and outer list paragraph separation consistent', () => {
    const options = { extensions: docsMarkdownExtensions() }
    const source = '- > [!NOTE]\n  > Body\n\n  Next paragraph\n- Last'
    const document = parseMarkdown(source, options)
    expect(document.children[0]).toMatchObject({ type: 'list', loose: true })
    expect(equivalent(document)).toContain('<p>Next paragraph</p>')
    const separated = parseMarkdown('> [!NOTE]\n> First\n\n> [!TIP]\n> Second', options)
    expect(separated.children.map(child => child.type)).toEqual(['callout', 'callout'])
    equivalent(separated)
  })

  it.each<BlockNode[]>([
    [],
    [{ type: 'code', value: 'code' }],
    [{ type: 'list', ordered: false, items: [{ type: 'listItem', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'item' }] }] }] }],
    [{ type: 'blockquote', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'quote' }] }] }],
  ])('adds footnote navigation after non-paragraph blocks without mutating the AST: %j', (...children) => {
    const document = { type: 'root' as const, children: [{ type: 'footnotes' as const, items: [{ id: 'note', number: 1, referenceCount: 2, children }] }] }
    const before = JSON.stringify(document)
    const html = equivalent(document)
    expect(html).toContain('<p><a data-footnote-backref=')
    expect(html).toContain('href="#user-content-fnref-note"')
    expect(html).toContain('href="#user-content-fnref-note-2"')
    expect(JSON.stringify(document)).toBe(before)
  })

  it('preserves Unicode intraword underscores', () => {
    for (const source of ['a_b_c', '\u00e9_word_', '_word_\u4e2d', '\u0661_word_']) {
      expect(parseInline(source)).toEqual([{ type: 'text', value: source }])
    }
    expect(equivalent('\u00a0_word_')).toContain('<em>word</em>')
  })

  it('preserves prototype-shaped component attributes as ordinary data', () => {
    const source = '<!-- ::widget __proto__="safe" constructor="literal" -->'
    expect(parseComponentComment(source)?.attributes).toEqual(Object.fromEntries([['__proto__', 'safe'], ['constructor', 'literal']]))
    expect(renderHtml(source, { extensions: [commentComponentsExtension()] })).toContain('&quot;__proto__&quot;:&quot;safe&quot;')
    expect(Object.getPrototypeOf({})).toBe(Object.prototype)
  })

  it('copies a matched component body before consuming its input', () => {
    const context: BlockParseContext = {
      lines: ['<!-- ::start:widget -->', 'Body', '<!-- ::end:widget -->'],
      index: 0,
      options: {},
      parseInline,
      parseBlocks: source => parseMarkdown(source).children,
      consume: count => {
        context.index += count
        context.lines.length = 0
      },
    }
    expect(parseCommentComponentBlock(context)).toMatchObject({ children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Body' }] }] })
    expect(context.index).toBe(3)
  })

  it('keeps component transforms and unmatched-block consumption unchanged', () => {
    for (const source of ['<!-- ::widget -->', '<!-- ::start:widget -->\nFollowing paragraph']) {
      const calls: string[] = []
      const document = parseMarkdown(source, { extensions: [commentComponentsExtension({ transformComponent(node) {
        calls.push(node.name)
        return { ...node, tagName: 'custom-widget' }
      } })] })
      expect(calls).toEqual(['widget'])
      expect(document.children[0]).toMatchObject({ type: 'component', tagName: 'custom-widget', children: [] })
      if (source.includes('\n')) expect(document.children[1]).toMatchObject({ type: 'paragraph' })
    }
  })

  it('bounds malformed destinations and long runs of list blank lines', () => {
    const output = execFileSync(process.execPath, ['--import', 'tsx', '--input-type=module', '-e',
      `import {parseMarkdown} from './src/parser.ts';
      for (const source of ['[label](/url "' + 'a'.repeat(100000) + ')', '- code\\n' + '\\n'.repeat(150000) + '  continuation']) {
        parseMarkdown(source);
      }
      console.log('ok');`,
    ], { encoding: 'utf8', timeout: 3000 })
    expect(output.trim()).toBe('ok')
  })
})
