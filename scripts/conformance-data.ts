import { createRequire } from 'node:module'
import { renderHtml } from '../src/html.js'

export const commonMarkVersion = '0.31.2'

interface CommonMarkExample {
  markdown: string
  html: string
  section: string
  number: number
}

interface CommonMarkSpec {
  tests: CommonMarkExample[]
}

export interface ConformanceSection {
  section: string
  total: number
  passing: number
  percent: number
}

export interface ConformanceResult {
  total: number
  passing: number[]
  percent: number
  sections: ConformanceSection[]
}

const baselineRanges =
  '13,15,17,19,21,28-31,35,42-47,49-54,56-58,61-68,70-74,77-79,87-88,92,94,97,99,101,104-106,108-109,113,119-130,135-137,139-140,142-143,146-147,149-167,174-175,178,186-190,197,199,207,209-210,212,219-224,227-230,234-235,237,239-241,243-246,248-249,255-256,258-263,265-266,268-269,275-277,279,281-284,291,294,296-299,301-303,305-306,308,314-317,320-329,334,338-339,343,345,348,350,355-357,361,363-365,370,377-378,381-382,390,394-396,403-405,420,422-424,428-430,433-434,436-438,440-441,443,446-450,452-453,455,458-463,469,482-484,496-497,501,510-515,517,522-523,528-529,531,535,545,547-549,551-552,565,569,571-572,578-583,590,611-612,617,625-628,630-631,641,644-652'

export const commonMarkBaseline = expandRanges(baselineRanges)

export function evaluateCommonMark(): ConformanceResult {
  const require = createRequire(import.meta.url)
  const examples = (require('commonmark-spec') as CommonMarkSpec).tests
  const passing: number[] = []
  const sections = new Map<string, { total: number; passing: number }>()

  for (const example of examples) {
    const actual = normalizeConformanceHtml(renderHtml(example.markdown, { allowHtml: true, headingIds: false }))
    const expected = normalizeConformanceHtml(example.html)
    const section = sections.get(example.section) ?? { total: 0, passing: 0 }
    section.total++
    if (actual === expected) {
      passing.push(example.number)
      section.passing++
    }
    sections.set(example.section, section)
  }

  return {
    total: examples.length,
    passing,
    percent: percentage(passing.length, examples.length),
    sections: [...sections].map(([section, result]) => ({
      section,
      ...result,
      percent: percentage(result.passing, result.total),
    })),
  }
}

export function normalizeConformanceHtml(value: string): string {
  return value
    .trim()
    .replace(/<pre class="tm-code" data-lang="([^"]+)"><code class="language-\1">/g, (_, lang: string) =>
      lang === 'plaintext' ? '<pre><code>' : `<pre><code class="language-${lang}">`,
    )
    .replace(/\n<\/code>/g, '</code>')
    .replace(/<(hr|br)(?: \/)?>/g, '<$1>')
    .replace(/<img([^>]*?) \/>/g, '<img$1>')
    .replace(/&#39;/g, "'")
    .replace(/>\s+</g, '><')
}

function expandRanges(value: string): number[] {
  const result: number[] = []
  for (const part of value.split(',')) {
    const [startValue, endValue] = part.split('-')
    const start = Number(startValue)
    const end = Number(endValue ?? startValue)
    for (let number = start; number <= end; number++) result.push(number)
  }
  return result
}

function percentage(value: number, total: number): number {
  return Math.round((value / total) * 1000) / 10
}
