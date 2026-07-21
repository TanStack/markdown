import { describe, expect, it } from 'vitest'
import { commonMarkBaseline, commonMarkVersion, evaluateCommonMark } from '../scripts/conformance-data.js'

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
})
