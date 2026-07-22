import { execFile } from 'node:child_process'
import { readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { promisify } from 'node:util'
import { auditCorpus } from './audit-corpus.js'

const execFileAsync = promisify(execFile)
const workspace = dirname(process.cwd())
const entries = await readdir(workspace, { withFileTypes: true })
const repositories = new Map<string, string>()

for (const entry of entries) {
  if (!entry.isDirectory()) continue
  const root = resolve(workspace, entry.name)
  const remote = await execFileAsync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8' }).catch(() => undefined)
  const url = String(remote?.stdout ?? '').trim()
  if (!/github\.com[/:]TanStack\//i.test(url)) continue

  const key = url.replace(/\.git$/i, '').toLowerCase()
  const current = repositories.get(key)
  const repositoryName = key.split(/[/:]/).at(-1)
  if (!current || entry.name.toLowerCase() === repositoryName) repositories.set(key, root)
}

const roots = [...repositories.values()].sort()
if (!roots.length) throw new Error(`No local TanStack repositories found under ${workspace}`)

const output = resolve('reports/tanstack-corpus')
const report = await auditCorpus({ name: 'TanStack repository corpus', output, roots })

console.log(
  `Audited ${report.totals.markdown} Markdown files and inventoried ${report.totals.mdx} MDX files across ${report.roots} local repositories.`,
)
console.log(`Report: ${output}.md`)
if (report.totals.errors || report.targetProfileContentDifferences) process.exitCode = 1
