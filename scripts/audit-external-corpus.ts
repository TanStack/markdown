import { execFile } from 'node:child_process'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { auditCorpus } from './audit-corpus.js'

interface ExternalRepository {
  name: string
  repository: string
  commit: string
  paths: string[]
}

const execFileAsync = promisify(execFile)
const root = process.cwd()
const cacheRoot = resolve(root, '.corpus/external')
const manifestPath = resolve(root, 'corpus/external-repositories.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as ExternalRepository[]
const roots: string[] = []

await mkdir(cacheRoot, { recursive: true })

for (const repository of manifest) {
  validateRepository(repository)
  const target = join(cacheRoot, repository.name)
  const marker = join(target, '.corpus-ref')
  const current = await readFile(marker, 'utf8').catch(() => '')

  if (current.trim() !== repository.commit) {
    await rm(target, { recursive: true, force: true })
    await cloneSparse(repository, target)
    await writeFile(marker, `${repository.commit}\n`)
  }

  roots.push(target)
}

const output = resolve(root, 'reports/external-corpus')
const report = await auditCorpus({
  name: 'Representative external docs and blogs corpus',
  output,
  roots,
})

console.log(
  `Audited ${report.totals.markdown} Markdown files and inventoried ${report.totals.mdx} MDX files across ${report.roots} pinned repositories.`,
)
console.log(`Report: ${output}.md`)
if (report.totals.errors || report.targetProfileContentDifferences) process.exitCode = 1

async function cloneSparse(repository: ExternalRepository, target: string) {
  const url = `https://github.com/${repository.repository}.git`
  console.log(`Fetching ${repository.repository}@${repository.commit.slice(0, 12)}`)
  await runGit(['clone', '--quiet', '--filter=blob:none', '--no-checkout', '--depth=1', url, target])

  try {
    await runGit(['-C', target, 'cat-file', '-e', `${repository.commit}^{commit}`])
  } catch {
    await runGit(['-C', target, 'fetch', '--quiet', '--depth=1', 'origin', repository.commit])
  }

  await runGit(['-C', target, 'sparse-checkout', 'init', '--cone'])
  await runGit(['-C', target, 'sparse-checkout', 'set', ...repository.paths])
  await runGit(['-C', target, 'checkout', '--quiet', '--detach', repository.commit])
}

async function runGit(args: string[]) {
  await execFileAsync('git', args, { maxBuffer: 20_000_000 })
}

function validateRepository(repository: ExternalRepository) {
  if (!/^[a-z0-9][a-z0-9._-]*$/i.test(repository.name)) throw new Error(`Invalid corpus name: ${repository.name}`)
  if (!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repository.repository)) throw new Error(`Invalid repository: ${repository.repository}`)
  if (!/^[a-f0-9]{40}$/.test(repository.commit)) throw new Error(`Invalid commit for ${repository.name}`)
  if (!repository.paths.length || repository.paths.some(path => path.startsWith('/') || path.includes('..'))) {
    throw new Error(`Invalid sparse paths for ${repository.name}`)
  }
}
