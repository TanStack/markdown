import { describe, expect, it } from 'vitest'
import { commonMarkBaseline, commonMarkVersion, evaluateCommonMark } from '../scripts/conformance-data.js'
import { renderHtml } from '../src/index.js'

describe(`CommonMark ${commonMarkVersion} compatibility accounting`, () => {
  const result = evaluateCommonMark()
  const passing = new Set(result.passing)

  it('preserves every upstream example in the established docs-profile baseline', () => {
    expect(commonMarkBaseline.filter(example => !passing.has(example))).toEqual([])
  })

  it('never lowers aggregate compatibility while allowing deliberate improvements', () => {
    expect(result.total).toBe(652)
    expect(result.passing.length).toBeGreaterThanOrEqual(commonMarkBaseline.length)
  })

  it('supports every CommonMark link reference title delimiter', () => {
    const markdown = `[single]: /single 'Single title'
[double]: /double "Double title"
[parenthesized]: /parenthesized (Parenthesized title)

[one][single] [two][double] [three][parenthesized]`

    expect(renderHtml(markdown)).toBe(
      '<p><a href="/single" title="Single title">one</a> <a href="/double" title="Double title">two</a> <a href="/parenthesized" title="Parenthesized title">three</a></p>',
    )
  })
})
