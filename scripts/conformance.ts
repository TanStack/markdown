import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { commonMarkBaseline, commonMarkVersion, evaluateCommonMark } from './conformance-data.js'

const reportsDir = join(process.cwd(), 'reports')
const result = evaluateCommonMark()
const baseline = new Set(commonMarkBaseline)
const passing = new Set(result.passing)
const lost = commonMarkBaseline.filter(example => !passing.has(example))
const gained = result.passing.filter(example => !baseline.has(example))

await mkdir(reportsDir, { recursive: true })
await writeFile(
  join(reportsDir, 'conformance.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), commonMarkVersion, baseline: commonMarkBaseline.length, lost, gained, ...result }, null, 2),
)
await writeFile(join(reportsDir, 'conformance.md'), renderReport())

function renderReport(): string {
  const lines = [
    '# Conformance Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    `This is compatibility accounting against CommonMark ${commonMarkVersion}, not a claim of CommonMark conformance.`,
    '',
    `- exact normalized matches: ${result.passing.length}/${result.total} (${result.percent}%)`,
    `- preserved baseline examples: ${commonMarkBaseline.length - lost.length}/${commonMarkBaseline.length}`,
    `- newly matching examples: ${gained.length}`,
    '',
    '| Section | Passing | Total | Percent |',
    '| :--- | ---: | ---: | ---: |',
  ]

  for (const section of result.sections) {
    lines.push(`| ${section.section} | ${section.passing} | ${section.total} | ${section.percent}% |`)
  }

  lines.push('')
  return lines.join('\n')
}
