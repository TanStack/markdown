import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/parser.js'

describe('table recognition and materialization', () => {
  it.each([
    ['H | I\n- | -\nA | B', ['table']],
    ['H\\|I\n---', ['table']],
    ['Header | Last\\|\n--- | ---\nBody | Final\\|', ['table']],
    ['H | I\n- || -', ['paragraph', 'list']],
    ['H | I\n: - | -:', ['paragraph']],
    ['H | I\n- | - | -', ['paragraph', 'list']],
    ['H | I\n-\\|-', ['paragraph']],
    ['H | I\n\u00a0- | -\u00a0', ['table']],
    ['Before\nH | I\n- | -', ['paragraph', 'table']],
  ] as const)('preserves loose table boundaries in %s', (source, types) => {
    expect(parseMarkdown(source).children.map(node => node.type)).toEqual(types)
  })

  it('honors live block edits and row-before-header inline hooks', () => {
    const values: string[] = []
    const document = parseMarkdown('H | I\n- | -\nA | B', { extensions: [{
      name: 'observe-table',
      parseBlock(context) { if (context.index === 0) context.lines[0] = 'Changed | I'; return undefined },
      transformInline(nodes) {
        values.push(nodes.map(node => node.type === 'text' ? node.value : node.type).join(''))
        return nodes
      },
    }] })
    expect(document.children[0]?.type).toBe('table')
    expect(values).toEqual(['A', 'B', 'Changed', 'I'])
  })
})
