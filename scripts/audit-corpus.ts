import { performance } from 'node:perf_hooks'
import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'
import { marked } from 'marked'
import { docsMarkdownExtensions } from '../src/extensions/docs.js'
import { parseMarkdown } from '../src/parser.js'
import { renderHtml } from '../src/html.js'
import { normalizeConformanceHtml } from './conformance-data.js'

const skippedDirectories = new Set([
  '.cache',
  '.git',
  '.next',
  '.output',
  '.pnpm-store',
  '.turbo',
  'artifacts',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'target',
  'vendor',
])

const maxFileBytes = 2_000_000
const execFileAsync = promisify(execFile)

export type CorpusFeature = keyof typeof featureMetadata
export type DocumentKind = 'blog' | 'changes' | 'docs' | 'fixture' | 'other' | 'readme'
export type Comparison = 'content' | 'exact' | 'serialization' | 'structure'

const featureMetadata = {
  'angle-autolink': { support: 'unsupported', description: 'Angle-bracket URL or email autolink' },
  'atx-heading': { support: 'profile', description: 'ATX heading' },
  blockquote: { support: 'profile', description: 'Block quote' },
  callout: { support: 'extension', description: 'GitHub-style callout' },
  'code-metadata': { support: 'profile', description: 'Metadata after a fenced-code language' },
  'combined-emphasis': { support: 'profile', description: 'Combined strong and emphasis delimiters' },
  'comment-component': { support: 'extension', description: 'Comment-delimited docs component' },
  'entity-reference': { support: 'partial', description: 'Named or numeric HTML entity' },
  'delimiter-edge': { support: 'review', description: 'Malformed or legacy emphasis or code delimiter usage' },
  'fenced-code': { support: 'profile', description: 'Fenced code block' },
  'fence-info-edge': { support: 'review', description: 'Generated or nonstandard fenced-code info string' },
  footnote: { support: 'profile', description: 'Footnote reference or definition' },
  'four-space-indent': { support: 'review', description: 'Four-space indentation, possibly indented code' },
  frontmatter: { support: 'profile', description: 'Leading YAML-style frontmatter' },
  'hard-break': { support: 'profile', description: 'Backslash hard line break' },
  'literal-autolink': { support: 'unsupported', description: 'Bare URL outside explicit link syntax' },
  'multiline-link': { support: 'review', description: 'Link or image destination split across lines' },
  'nested-list': { support: 'profile', description: 'Nested list item' },
  'ordered-paren-list': { support: 'profile', description: 'Ordered list using a closing parenthesis' },
  'raw-html': { support: 'opt-in', description: 'Raw HTML tag' },
  'reference-link': { support: 'profile', description: 'Reference link or image definition' },
  'section-marker': { support: 'extension', description: 'TanStack section marker written as a reference definition' },
  'setext-heading': { support: 'unsupported', description: 'Setext heading' },
  'site-template': { support: 'site-extension', description: 'Liquid, JSX-comment, or site template directive' },
  strikethrough: { support: 'profile', description: 'Strikethrough delimiter' },
  'tab-indentation': { support: 'unsupported', description: 'Tab-indented content' },
  table: { support: 'profile', description: 'Pipe table' },
  'task-list': { support: 'profile', description: 'Task list item' },
} as const

export interface AuditOptions {
  name: string
  output: string
  roots: string[]
}

interface AuditedFile {
  bytes: number
  comparison?: Comparison
  contentDifference?: { actual: string; reference: string }
  durationMs?: number
  error?: string
  features: CorpusFeature[]
  format: 'md' | 'mdx'
  kind: DocumentKind
  path: string
  repository: string
}

interface RepositorySummary {
  bytes: number
  comparisons: Record<Comparison, number>
  errors: number
  features: Partial<Record<CorpusFeature, number>>
  markdown: number
  mdx: number
  name: string
  dirty?: boolean
  remote?: string
  revision?: string
  skipped: number
}

export interface AuditReport {
  generatedAt: string
  name: string
  roots: number
  durationMs: number
  totals: RepositorySummary
  repositories: RepositorySummary[]
  kinds: Record<DocumentKind, number>
  profileContentDifferences: number
  targetProfileContentDifferences: number
  notableFiles: AuditedFile[]
}

export function detectCorpusFeatures(source: string): CorpusFeature[] {
  const features = new Set<CorpusFeature>()
  const withoutFrontmatter = stripFrontmatter(source)
  const scan = maskCode(withoutFrontmatter, features)

  if (withoutFrontmatter !== source) features.add('frontmatter')
  if (/^ {0,3}#{1,6}(?:[ \t]+|$)/m.test(scan)) features.add('atx-heading')
  if (hasSetextHeading(scan)) features.add('setext-heading')
  if (/^ {0,3}>/m.test(scan)) features.add('blockquote')
  if (/^ {0,3}>\s*\[![A-Za-z]+\]/m.test(scan)) features.add('callout')
  if (/^ {0,3}<!--\s*::(?:start:|end:)?[A-Za-z]/m.test(scan)) features.add('comment-component')
  if (/^ {0,3}\[[^\]\n]+\]:\s*\S/m.test(scan)) features.add('reference-link')
  if (/^ {0,3}\[\/\/\]:\s*#/m.test(scan)) features.add('section-marker')
  if (/\[\^[^\]\n]+\](?::)?/.test(scan)) features.add('footnote')
  if (/^\s*[-+*]\s+\[[ xX]\]\s+/m.test(scan)) features.add('task-list')
  if (/^ {2,}(?:[-+*]|\d+[.)])\s+/m.test(scan)) features.add('nested-list')
  if (/^ {0,3}\d+\)\s+/m.test(scan)) features.add('ordered-paren-list')
  if (/^ {0,3}\|?.+\|.+\n {0,3}\|?\s*:?-{3,}/m.test(scan)) features.add('table')
  if (/~~[^\n~]+~~/.test(scan)) features.add('strikethrough')
  if (/(?:\*{3}|_{3})[^\n]+?(?:\*{3}|_{3})/.test(scan)) features.add('combined-emphasis')
  if (
    /(?:\*\*|__)[^\n]*[ \t](?:\*\*|__)(?=$|[\s.,;:!?)}\]])/m.test(scan) ||
    /(?:^|[\s(])_[^\n_]+[ \t]_(?=$|[\s.,;:!?)}\]])/m.test(scan) ||
    /\*\*\*[^*\n]+\*[^\n]*\*\*/.test(scan) ||
    hasOddBacktickLinkLabel(scan)
  ) {
    features.add('delimiter-edge')
  }
  if (/\]\([^\n)]*\n/.test(scan)) features.add('multiline-link')
  if (/(?:^|[^\\])\\\n/.test(scan)) features.add('hard-break')
  if (/&(?:#[0-9]+|#x[0-9a-f]+|[a-z][a-z0-9]+);/i.test(scan)) features.add('entity-reference')
  if (/<\/?[A-Za-z][^>\n]*>/.test(scan)) features.add('raw-html')
  if (/<(?:https?:\/\/|mailto:)[^>\s]+>/.test(scan)) features.add('angle-autolink')
  if (/^\t/m.test(scan)) features.add('tab-indentation')
  if (/^ {4,}\S/m.test(scan)) features.add('four-space-indent')
  if (/{%[\s\S]*?%}|{{[\s\S]*?}}|{\/\*[\s\S]*?\*\/}/.test(scan)) features.add('site-template')

  const withoutExplicitLinks = scan
    .replace(/!?\[[^\]\n]*\]\([^\n)]*\)/g, '')
    .replace(/<(?:https?:\/\/|mailto:)[^>\s]+>/g, '')
    .replace(/\bhttps?:\/\/[^\s<]+/g, match => {
      features.add('literal-autolink')
      return ' '
    })
  void withoutExplicitLinks

  return [...features].sort()
}

export function compareRenderedHtml(actual: string, reference: string): Comparison {
  const normalizedActual = normalizeCorpusHtml(actual)
  const normalizedReference = normalizeCorpusHtml(reference)
  if (normalizedActual === normalizedReference) return 'exact'
  if (htmlShape(normalizedActual) === htmlShape(normalizedReference)) return 'serialization'
  if (renderedText(actual) === renderedText(reference)) return 'structure'
  return 'content'
}

export function classifyDocument(path: string): DocumentKind {
  const normalized = path.toLowerCase().split(sep).join('/')
  const name = basename(normalized)
  if (/^readme(?:\.[^.]+)?\.md$/.test(name) || name === 'readme.md') return 'readme'
  if (/(^|\/)(blog|blogs|posts)(\/|$)/.test(normalized)) return 'blog'
  if (/(^|\/)(\.changeset|changelog|changes|releases)(\/|$)/.test(normalized) || /^changelog(?:\.|$)/.test(name)) return 'changes'
  if (/(^|\/)(fixtures?|snapshots?|tests?|evals?|examples?)(\/|$)/.test(normalized)) return 'fixture'
  if (/(^|\/)(docs?|documentation|guides?|content|pages)(\/|$)/.test(normalized)) return 'docs'
  return 'other'
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  const report = await auditCorpus(options)

  console.log(
    `Audited ${report.totals.markdown} Markdown files and inventoried ${report.totals.mdx} MDX files across ${report.roots} roots.`,
  )
  console.log(`Report: ${options.output}.md`)
  console.log(`Details: ${resolve('artifacts/corpus', `${basename(options.output)}.files.json`)}`)
  if (report.totals.errors) process.exitCode = 1
}

export async function auditCorpus(options: AuditOptions): Promise<AuditReport> {
  const started = performance.now()
  const repositoryResults: Array<{ files: AuditedFile[]; summary: RepositorySummary }> = []

  for (const rootValue of options.roots) {
    const root = resolve(rootValue)
    const git = await readGitMetadata(root)
    const paths = await collectMarkdownFiles(root)
    const files: AuditedFile[] = []
    let skipped = 0

    for (const path of paths) {
      let source: string
      try {
        source = await readFile(path, 'utf8')
      } catch (error) {
        if (isMissingFileError(error)) {
          skipped++
          continue
        }
        throw error
      }
      const bytes = Buffer.byteLength(source)
      const format = path.toLowerCase().endsWith('.mdx') ? 'mdx' : 'md'
      const base: AuditedFile = {
        repository: basename(root),
        path: relative(root, path).split(sep).join('/'),
        kind: classifyDocument(relative(root, path)),
        format,
        bytes,
        features: detectCorpusFeatures(source),
      }

      if (format === 'mdx') {
        files.push(base)
        continue
      }

      if (bytes > maxFileBytes) {
        skipped++
        files.push({ ...base, error: `File exceeds ${maxFileBytes} byte audit limit` })
        continue
      }

      const before = performance.now()
      try {
        const parseOptions = {
          allowHtml: true,
          extensions: docsMarkdownExtensions(),
          headingIds: false,
        } as const
        const firstDocument = JSON.stringify(parseMarkdown(source, parseOptions))
        const secondDocument = JSON.stringify(parseMarkdown(source, parseOptions))
        const firstHtml = renderHtml(source, parseOptions)
        const secondHtml = renderHtml(source, parseOptions)
        if (firstDocument !== secondDocument || firstHtml !== secondHtml) {
          throw new Error('Non-deterministic parser or renderer output')
        }

        const reference = String(marked.parse(stripFrontmatter(source), { gfm: true }))
        const comparison = compareRenderedHtml(firstHtml, reference)
        files.push({
          ...base,
          comparison,
          ...(comparison === 'content' ? { contentDifference: locateTextDifference(firstHtml, reference) } : {}),
          durationMs: performance.now() - before,
        })
      } catch (error) {
        files.push({
          ...base,
          durationMs: performance.now() - before,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    repositoryResults.push({ files, summary: summarizeRepository(basename(root), files, skipped, git) })
  }

  const allFiles = repositoryResults.flatMap(result => result.files)
  const repositories = repositoryResults.map(result => result.summary)
  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    name: options.name,
    roots: options.roots.length,
    durationMs: performance.now() - started,
    totals: combineSummaries(options.name, repositories),
    repositories,
    kinds: countKinds(allFiles),
    profileContentDifferences: allFiles.filter(file => file.comparison === 'content' && hasOnlyProfileFeatures(file)).length,
    targetProfileContentDifferences: allFiles.filter(file => isActionableTargetDifference(file)).length,
    notableFiles: selectNotableFiles(allFiles),
  }

  await mkdir(dirname(options.output), { recursive: true })
  await writeFile(`${options.output}.json`, `${JSON.stringify(report, null, 2)}\n`)
  await writeFile(`${options.output}.md`, renderReport(report))
  const detailsPath = resolve('artifacts/corpus', `${basename(options.output)}.files.json`)
  await mkdir(dirname(detailsPath), { recursive: true })
  await writeFile(detailsPath, `${JSON.stringify(allFiles, null, 2)}\n`)

  return report
}

function parseArguments(args: string[]): AuditOptions {
  let name = 'Practical Markdown corpus'
  let output = resolve('reports/practical-corpus')
  const roots: string[] = []

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--') {
      continue
    } else if (arg === '--name') {
      name = requiredArgument(args, ++index, '--name')
    } else if (arg === '--output') {
      output = resolve(requiredArgument(args, ++index, '--output')).replace(/\.(?:json|md)$/i, '')
    } else if (arg?.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    } else if (arg) {
      roots.push(arg)
    }
  }

  const environmentRoots = (process.env.MARKDOWN_CORPUS_DIRS ?? '').split(process.platform === 'win32' ? ';' : ':').filter(Boolean)
  roots.push(...environmentRoots)
  if (!roots.length) throw new Error('Pass at least one corpus root or set MARKDOWN_CORPUS_DIRS')
  return { name, output, roots: [...new Set(roots.map(root => resolve(root)))] }
}

function requiredArgument(args: string[], index: number, option: string): string {
  const value = args[index]
  if (!value) throw new Error(`${option} requires a value`)
  return value
}

async function collectMarkdownFiles(root: string): Promise<string[]> {
  try {
    const { stdout } = await execFileAsync('git', ['-C', root, 'ls-files', '-z', '-t', '--', '*.md', '*.mdx'], {
      encoding: 'utf8',
      maxBuffer: 20_000_000,
    })
    return String(stdout)
      .split('\0')
      .filter(path => path.startsWith('H '))
      .map(path => resolve(root, path.slice(2)))
      .sort()
  } catch {
    // Non-Git corpora still work through the filesystem fallback.
  }

  const result: string[] = []

  async function walk(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!skippedDirectories.has(entry.name)) await walk(resolve(directory, entry.name))
        continue
      }
      if (entry.isFile() && /\.mdx?$/i.test(entry.name)) result.push(resolve(directory, entry.name))
    }
  }

  await walk(root)
  return result.sort()
}

function summarizeRepository(
  name: string,
  files: AuditedFile[],
  skipped: number,
  git: Pick<RepositorySummary, 'dirty' | 'remote' | 'revision'>,
): RepositorySummary {
  const summary = emptySummary(name)
  if (git.dirty) summary.dirty = true
  if (git.remote) summary.remote = git.remote
  if (git.revision) summary.revision = git.revision
  summary.skipped = skipped
  for (const file of files) {
    summary.bytes += file.bytes
    if (file.format === 'mdx') {
      summary.mdx++
      continue
    }
    summary.markdown++
    if (file.error) summary.errors++
    if (file.comparison) summary.comparisons[file.comparison]++
    for (const feature of file.features) summary.features[feature] = (summary.features[feature] ?? 0) + 1
  }
  return summary
}

async function readGitMetadata(root: string): Promise<Pick<RepositorySummary, 'dirty' | 'remote' | 'revision'>> {
  try {
    const [{ stdout: revision }, { stdout: remote }, { stdout: status }] = await Promise.all([
      execFileAsync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }),
      execFileAsync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }),
      execFileAsync('git', ['-C', root, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' }),
    ])
    return { revision: String(revision).trim(), remote: String(remote).trim(), dirty: Boolean(String(status).trim()) }
  } catch {
    return {}
  }
}

function combineSummaries(name: string, summaries: RepositorySummary[]): RepositorySummary {
  const total = emptySummary(name)
  for (const summary of summaries) {
    total.bytes += summary.bytes
    total.markdown += summary.markdown
    total.mdx += summary.mdx
    total.skipped += summary.skipped
    total.errors += summary.errors
    for (const comparison of Object.keys(total.comparisons) as Comparison[]) {
      total.comparisons[comparison] += summary.comparisons[comparison]
    }
    for (const feature of Object.keys(summary.features) as CorpusFeature[]) {
      total.features[feature] = (total.features[feature] ?? 0) + (summary.features[feature] ?? 0)
    }
  }
  return total
}

function emptySummary(name: string): RepositorySummary {
  return {
    name,
    bytes: 0,
    markdown: 0,
    mdx: 0,
    skipped: 0,
    errors: 0,
    comparisons: { exact: 0, serialization: 0, structure: 0, content: 0 },
    features: {},
  }
}

function countKinds(files: AuditedFile[]): Record<DocumentKind, number> {
  const result: Record<DocumentKind, number> = { blog: 0, changes: 0, docs: 0, fixture: 0, other: 0, readme: 0 }
  for (const file of files) if (file.format === 'md') result[file.kind]++
  return result
}

function isTargetContent(file: AuditedFile): boolean {
  return file.kind === 'blog' || file.kind === 'docs' || file.kind === 'readme'
}

function selectNotableFiles(files: AuditedFile[]): AuditedFile[] {
  const severity: Record<Comparison, number> = { content: 3, structure: 2, serialization: 1, exact: 0 }
  return files
    .filter(file => file.error || file.comparison === 'content' || file.comparison === 'structure')
    .sort((left, right) => {
      const errorDifference = Number(Boolean(right.error)) - Number(Boolean(left.error))
      if (errorDifference) return errorDifference
      const profileDifference = Number(hasOnlyProfileFeatures(right)) - Number(hasOnlyProfileFeatures(left))
      if (profileDifference) return profileDifference
      const comparisonDifference = severity[right.comparison ?? 'exact'] - severity[left.comparison ?? 'exact']
      if (comparisonDifference) return comparisonDifference
      return right.bytes - left.bytes
    })
    .slice(0, 100)
}

function renderReport(report: AuditReport): string {
  const lines = [
    `# ${report.name}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'This report measures practical corpus behavior. Marked is a differential reference, not a correctness oracle. MDX is inventoried but not parsed.',
    '',
    `- repositories or roots: ${report.roots}`,
    `- Markdown documents: ${report.totals.markdown}`,
    `- MDX documents inventoried: ${report.totals.mdx}`,
    `- source bytes: ${report.totals.bytes}`,
    `- parse or determinism errors: ${report.totals.errors}`,
    `- content differences using only profile syntax: ${report.profileContentDifferences}`,
    `- unexplained target docs/blog/README content differences using only profile syntax: ${report.targetProfileContentDifferences}`,
    `- audit time: ${report.durationMs.toFixed(1)} ms`,
    '',
    '## Output comparison',
    '',
    '| Result | Documents | Percent | Meaning |',
    '| :--- | ---: | ---: | :--- |',
    comparisonRow('exact', report.totals, 'Normalized HTML matches Marked'),
    comparisonRow('serialization', report.totals, 'Tag and text shape matches; attributes or serialization differ'),
    comparisonRow('structure', report.totals, 'Text matches; element structure differs'),
    comparisonRow('content', report.totals, 'Rendered text differs and requires triage'),
    '',
    '## Repositories',
    '',
    '| Repository | Revision | Dirty | Markdown | MDX | Exact | Serialization | Structure | Content | Errors |',
    '| :--- | :--- | :---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ]

  for (const repository of report.repositories) {
    lines.push(
      `| ${repositoryCell(repository)} | ${revisionCell(repository)} | ${repository.dirty ? 'yes' : 'no'} | ${repository.markdown} | ${repository.mdx} | ${repository.comparisons.exact} | ${repository.comparisons.serialization} | ${repository.comparisons.structure} | ${repository.comparisons.content} | ${repository.errors} |`,
    )
  }

  lines.push('', '## Content kinds', '', '| Kind | Documents |', '| :--- | ---: |')
  for (const [kind, count] of Object.entries(report.kinds)) lines.push(`| ${kind} | ${count} |`)

  lines.push('', '## Syntax usage', '', '| Feature | Support | Documents | Description |', '| :--- | :--- | ---: | :--- |')
  for (const [feature, count] of Object.entries(report.totals.features).sort((left, right) => right[1] - left[1])) {
    const metadata = featureMetadata[feature as CorpusFeature]
    lines.push(`| ${feature} | ${metadata.support} | ${count} | ${metadata.description} |`)
  }

  lines.push(
    '',
    '## Highest-priority differences',
    '',
    'These are triage leads, ordered by parser errors, content differences, structural differences, then file size.',
    '',
    '| Repository | Path | Kind | Result | Features |',
    '| :--- | :--- | :--- | :--- | :--- |',
  )
  for (const file of report.notableFiles.slice(0, 40)) {
    lines.push(
      `| ${escapeCell(file.repository)} | ${escapeCell(file.path)} | ${file.kind} | ${escapeCell(file.error ?? file.comparison ?? 'inventory')} | ${escapeCell(file.features.join(', '))} |`,
    )
  }

  lines.push(
    '',
    '## Interpretation policy',
    '',
    '- Parser errors and nondeterminism are release blockers.',
    '- Content differences in maintained TanStack docs require review and usually a regression fixture.',
    '- Structural differences matter when they affect semantics, accessibility, styling, or hydration.',
    '- Serializer and attribute differences are accepted when browser semantics are equivalent.',
    '- Marked does not render footnotes; footnote-only content differences remain visible but are excluded from the unexplained target count.',
    '- Unsupported syntax found only in external or specification corpora is evidence, not an automatic feature request.',
    '- MDX requires an MDX compiler and is outside this package profile.',
    '',
  )
  return lines.join('\n')
}

function hasOnlyProfileFeatures(file: AuditedFile): boolean {
  return file.features.every(feature => featureMetadata[feature].support === 'profile')
}

function repositoryCell(repository: RepositorySummary): string {
  const remote = webRemote(repository.remote)
  return remote ? `[${escapeCell(repository.name)}](${remote})` : escapeCell(repository.name)
}

function revisionCell(repository: RepositorySummary): string {
  if (!repository.revision) return '-'
  const label = repository.revision.slice(0, 8)
  const remote = webRemote(repository.remote)
  return remote ? `[${label}](${remote}/tree/${repository.revision})` : label
}

function webRemote(remote: string | undefined): string | undefined {
  if (!remote) return undefined
  const url = remote.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '')
  return /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(url) ? url : undefined
}

function isActionableTargetDifference(file: AuditedFile): boolean {
  return (
    isTargetContent(file) &&
    file.comparison === 'content' &&
    hasOnlyProfileFeatures(file) &&
    !file.features.includes('footnote')
  )
}

function comparisonRow(comparison: Comparison, summary: RepositorySummary, meaning: string): string {
  const count = summary.comparisons[comparison]
  const percent = summary.markdown ? ((count / summary.markdown) * 100).toFixed(1) : '0.0'
  return `| ${comparison} | ${count} | ${percent}% | ${meaning} |`
}

function normalizeCorpusHtml(value: string): string {
  return normalizeConformanceHtml(value)
    .replace(/\sclass="(?:contains-task-list|task-list-item)"/g, '')
    .replace(/<input([^>]*?)\sdisabled(?:="")?([^>]*)>/g, '<input$1 disabled$2>')
    .replace(/<input([^>]*?)\schecked(?:="")?([^>]*)>/g, '<input$1 checked$2>')
    .replace(/\s+aria-hidden="true"/g, '')
    .replace(/>\s+</g, '><')
    .trim()
}

function htmlShape(value: string): string {
  return decodeBasicEntities(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<([A-Za-z][\w-]*)(?:\s[^<>]*?)?>/g, '<$1>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function renderedText(value: string): string {
  return decodeBasicEntities(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<figcaption(?:\s[^>]*)?>[\s\S]*?<\/figcaption>/gi, '')
    .replace(/<\/?(?:address|article|aside|blockquote|br|div|figcaption|figure|footer|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)(?:\s[^>]*)?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function locateTextDifference(actualHtml: string, referenceHtml: string): { actual: string; reference: string } {
  const actual = renderedText(actualHtml)
  const reference = renderedText(referenceHtml)
  let index = 0
  while (actual[index] === reference[index] && index < actual.length && index < reference.length) index++
  const start = Math.max(0, index - 80)
  const end = index + 160
  return {
    actual: `${start ? '...' : ''}${actual.slice(start, end)}${end < actual.length ? '...' : ''}`,
    reference: `${start ? '...' : ''}${reference.slice(start, end)}${end < reference.length ? '...' : ''}`,
  }
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function stripFrontmatter(source: string): string {
  const normalized = source.replace(/\r\n?/g, '\n')
  if (!normalized.startsWith('---\n')) return normalized
  const match = /\n---(?:\n|$)/.exec(normalized.slice(4))
  return match ? normalized.slice(4 + match.index + match[0].length) : normalized
}

function maskCode(source: string, features: Set<CorpusFeature>): string {
  const lines = source.replace(/\r\n?/g, '\n').split('\n')
  let fence: { character: string; size: number } | undefined

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? ''
    const match = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/)
    if (fence) {
      lines[index] = ''
      if (match && match[1]?.[0] === fence.character && match[1].length >= fence.size && !match[2]?.trim()) fence = undefined
      continue
    }
    if (match) {
      features.add('fenced-code')
      const info = match[2]?.trim() ?? ''
      if (/^[A-Za-z0-9_+.#-]+\s+\S/.test(info)) features.add('code-metadata')
      if (info && !/^[A-Za-z0-9_+.#-]+(?:\s|$)/.test(info)) features.add('fence-info-edge')
      fence = { character: match[1]![0]!, size: match[1]!.length }
      lines[index] = ''
      continue
    }
    lines[index] = line.replace(/(`+)([\s\S]*?)\1/g, '')
  }

  return lines.join('\n')
}

function hasOddBacktickLinkLabel(source: string): boolean {
  for (const match of source.matchAll(/\[([^\]\n]*)\]\(/g)) {
    if ((match[1]?.match(/(?<!\\)`/g)?.length ?? 0) % 2 === 1) return true
  }
  return false
}

function hasSetextHeading(source: string): boolean {
  const lines = source.split('\n')
  for (let index = 1; index < lines.length; index++) {
    const underline = lines[index] ?? ''
    const previous = lines[index - 1]?.trim() ?? ''
    if (previous && !/^ {0,3}(?:[-+*]|\d+[.)])\s/.test(lines[index - 1] ?? '') && /^ {0,3}(?:=+|-{2,})\s*$/.test(underline)) return true
  }
  return false
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT'
}

const entry = process.argv[1] ? resolve(process.argv[1]) : undefined
if (entry && import.meta.url === new URL(`file://${entry}`).href) {
  main().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}
