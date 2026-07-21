import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const root = process.cwd()
const docsDirectory = path.join(root, 'docs')
const failures = []
const anchorCache = new Map()

const config = JSON.parse(
  await fs.readFile(path.join(docsDirectory, 'config.json'), 'utf8'),
)

const navigationPaths = new Set()
collectNavigationPaths(config.sections)

const markdownFiles = (await walk(docsDirectory))
  .filter((file) => file.endsWith('.md'))
  .sort()

for (const navigationPath of navigationPaths) {
  const file = await resolveMarkdownPath(
    path.join(docsDirectory, navigationPath),
  )
  if (!file) failures.push(`Navigation target does not exist: ${navigationPath}`)
}

for (const file of markdownFiles) {
  const relativePath = toPosix(path.relative(docsDirectory, file))
  const navigationPath = relativePath.replace(/\.md$/, '')
  if (!navigationPaths.has(navigationPath)) {
    failures.push(`Documentation page is missing from navigation: ${relativePath}`)
  }

  const source = await fs.readFile(file, 'utf8')
  if (!source.startsWith('---\n')) {
    failures.push(`Documentation page is missing frontmatter: ${relativePath}`)
  }

  await validateLinks(file, source)
}

await validateLinks(
  path.join(root, 'README.md'),
  await fs.readFile(path.join(root, 'README.md'), 'utf8'),
)

const packageJson = JSON.parse(
  await fs.readFile(path.join(root, 'package.json'), 'utf8'),
)
const apiDocuments = new Map([
  ['.', 'docs/reference/default-entry.md'],
  ['./html', 'docs/reference/html.md'],
  ['./parser', 'docs/reference/parser.md'],
  ['./react', 'docs/reference/react.md'],
  ['./extensions/callouts', 'docs/reference/extensions.md'],
  ['./extensions/comment-components', 'docs/reference/extensions.md'],
  ['./extensions/docs', 'docs/reference/extensions.md'],
  ['./extensions/framework', 'docs/reference/extensions.md'],
  ['./extensions/headings', 'docs/reference/extensions.md'],
  ['./extensions/tabs', 'docs/reference/extensions.md'],
])
const referenceIndex = await fs.readFile(
  path.join(root, 'docs/reference/index.md'),
  'utf8',
)

for (const [exportPath, entry] of Object.entries(packageJson.exports)) {
  const documentationPath = apiDocuments.get(exportPath)
  if (!documentationPath) {
    failures.push(`Public package entry is missing API documentation: ${exportPath}`)
    continue
  }

  const publicSpecifier =
    exportPath === '.'
      ? packageJson.name
      : `${packageJson.name}${exportPath.slice(1)}`
  if (!referenceIndex.includes(`\`${publicSpecifier}\``)) {
    failures.push(`Public package entry is missing from the API index: ${publicSpecifier}`)
  }

  await validateApiCoverage(entry.types, documentationPath)
}

await validateApiCoverage('./dist/types.d.ts', 'docs/reference/types.md')

if (failures.length) {
  console.error(
    `Documentation verification failed:\n\n${failures.map((failure) => `- ${failure}`).join('\n')}`,
  )
  process.exit(1)
}

console.log(
  `Documentation verified: ${markdownFiles.length} pages, ${navigationPaths.size} navigation targets, and all public exports documented.`,
)

function collectNavigationPaths(items) {
  for (const item of items || []) {
    if (typeof item.to === 'string') {
      if (navigationPaths.has(item.to)) {
        failures.push(`Duplicate navigation target: ${item.to}`)
      }
      navigationPaths.add(item.to)
    }
    collectNavigationPaths(item.children)
  }
}

async function validateLinks(file, source) {
  const withoutCode = source.replace(/```[\s\S]*?```/g, '')
  const linkPattern = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g
  let match

  while ((match = linkPattern.exec(withoutCode))) {
    const target = match[1].trim().replace(/^<|>$/g, '')
    if (!target || /^(?:https?:|mailto:|tel:)/.test(target)) continue

    const [pathAndQuery, fragment] = target.split('#', 2)
    const pathPart = pathAndQuery.split('?', 1)[0]
    const resolved = pathPart
      ? path.resolve(path.dirname(file), decodeURIComponent(pathPart))
      : file
    const markdownPath = pathPart ? await resolveMarkdownPath(resolved) : file
    if (!markdownPath) {
      failures.push(
        `Broken local link in ${toPosix(path.relative(root, file))}: ${target}`,
      )
      continue
    }

    if (fragment) {
      const anchors = await getAnchors(markdownPath)
      const anchor = decodeURIComponent(fragment).toLowerCase()
      if (!anchors.has(anchor)) {
        failures.push(
          `Broken local anchor in ${toPosix(path.relative(root, file))}: ${target}`,
        )
      }
    }
  }
}

async function getAnchors(file) {
  if (anchorCache.has(file)) return anchorCache.get(file)

  const source = await fs.readFile(file, 'utf8')
  const anchors = new Set()
  const occurrences = new Map()

  for (const line of source.replace(/```[\s\S]*?```/g, '').split('\n')) {
    const heading = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line)?.[1]
    if (!heading) continue

    const base = heading
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/[`*_~]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .trim()
      .replace(/\s+/g, '-')
    const occurrence = occurrences.get(base) || 0
    occurrences.set(base, occurrence + 1)
    anchors.add(occurrence ? `${base}-${occurrence}` : base)
  }

  anchorCache.set(file, anchors)
  return anchors
}

async function validateApiCoverage(declarationPath, documentationPath) {
  const normalizedDeclarationPath = declarationPath.replace(/^\.\//, '')
  const declarations = await exportedNames(
    path.join(root, normalizedDeclarationPath),
  )
  const documentation = await fs.readFile(
    path.join(root, documentationPath),
    'utf8',
  )

  for (const name of declarations) {
    if (!documentation.includes(`\`${name}\``)) {
      failures.push(
        `Public export ${name} from ${normalizedDeclarationPath} is missing from ${documentationPath}`,
      )
    }
  }
}

async function exportedNames(file) {
  const source = await fs.readFile(file, 'utf8')
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const names = new Set()

  for (const node of sourceFile.statements) {
    if (ts.isExportDeclaration(node) && node.exportClause) {
      if (ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          names.add(element.name.text)
        }
      }
      continue
    }

    if (!hasExportModifier(node)) continue

    if (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node)
    ) {
      if (node.name) names.add(node.name.text)
      continue
    }

    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text)
      }
    }
  }

  return [...names].sort()
}

function hasExportModifier(node) {
  return Boolean(
    node.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ),
  )
}

async function resolveMarkdownPath(basePath) {
  const candidates = path.extname(basePath)
    ? [basePath]
    : [`${basePath}.md`, `${basePath}.mdx`, path.join(basePath, 'index.md')]

  for (const candidate of candidates) {
    try {
      if ((await fs.stat(candidate)).isFile()) return candidate
    } catch {
      // Try the next supported documentation path shape.
    }
  }
}

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await walk(entryPath)))
    else files.push(entryPath)
  }

  return files
}

function toPosix(value) {
  return value.split(path.sep).join('/')
}
