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
  '12-15,17,19,21,28-31,35,42-47,49-58,61-68,70-79,87-88,92,94,97,99,101,104-106,108-109,113,119-133,135-137,139-140,142-143,146-147,149-167,174-175,177-179,186-190,192,197,199-201,203-205,207,209-210,212,214,216,219-224,227-230,234-235,237,239-241,243-246,248-249,255-256,258-263,265-269,275-277,279,281-284,291,294,296-299,301-308,314-317,319-334,338-340,343,345,348-350,355-365,370-372,374-378,381-388,390,393-406,410-411,414-416,418,420,422-424,428-430,433-434,436-438,440-441,443,446-450,452-453,455,458-463,467,469,482-488,490-491,494-498,500-501,505,508-520,522-523,527-533,535,539,542-545,547-563,565-567,569-593,607-608,611-612,617-618,621,625-628,630-631,641,644-652'

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
