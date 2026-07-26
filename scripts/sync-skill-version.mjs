import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const root = process.cwd()
const skillsDirectory = path.join(root, 'skills')
const packageJson = JSON.parse(
  await fs.readFile(path.join(root, 'package.json'), 'utf8'),
)
const version = packageJson.version
const check = process.argv.includes('--check')
const files = (await walk(skillsDirectory)).filter((file) =>
  /\.(?:md|yaml)$/.test(file),
)
const skillFiles = files.filter((file) => file.endsWith('/SKILL.md'))
const previousVersions = new Set()
const failures = []

for (const file of skillFiles) {
  const source = await fs.readFile(file, 'utf8')
  const match = source.match(/library_version:\s*'([^']+)'/)
  if (!match) {
    failures.push(
      `${path.relative(root, file)} is missing metadata.library_version`,
    )
    continue
  }
  previousVersions.add(match[1])
}

for (const file of files) {
  const source = await fs.readFile(file, 'utf8')
  const updated = syncVersion(source)
  if (updated === source) continue

  if (check) {
    failures.push(`${path.relative(root, file)} does not target ${version}`)
  } else {
    await fs.writeFile(file, updated)
  }
}

if (failures.length) {
  console.error(
    `Skill version verification failed:\n\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
  )
  process.exit(1)
}

console.log(
  check
    ? `Skill versions match ${packageJson.name}@${version}.`
    : `Synchronized skill versions to ${packageJson.name}@${version}.`,
)

function syncVersion(source) {
  let result = source
    .replace(/(library_version:\s*')[^']+(')/g, `$1${version}$2`)
    .replace(
      /(@tanstack\/markdown@)\d+\.\d+\.\d+/g,
      `$1${version}`,
    )
    .replace(/(markdown-)\d+\.\d+\.\d+(:)/g, `$1${version}$2`)
    .replace(/^(# Version: )\d+\.\d+\.\d+$/gm, `$1${version}`)
    .replace(/^(\s+version:\s*')[^']+(')$/gm, `$1${version}$2`)

  for (const previousVersion of previousVersions) {
    if (previousVersion === version) continue
    result = result.replace(
      new RegExp(
        `(version_context: '[^'\\n]*)${escapeRegExp(previousVersion)}`,
        'g',
      ),
      `$1${version}`,
    )
  }

  return result
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(file)))
    else files.push(file)
  }

  return files
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
