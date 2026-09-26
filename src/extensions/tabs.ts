import type { BlockNode, ComponentNode } from '../types.js'
import { blocksToText, slugify, splitByHeading } from './shared.js'

export function transformTabsComponent(node: ComponentNode): ComponentNode {
  const variant = node.attributes.variant?.toLowerCase()

  if (variant === 'files') return transformFileTabs(node)
  if (variant === 'package-manager' || variant === 'package-managers') return transformPackageManagerTabs(node)
  if (variant === 'bundler') return transformBundlerTabs(node)

  return transformHeadingTabs(node)
}

export function transformFileTabs(node: ComponentNode): ComponentNode {
  const files = node.children.filter((child): child is Extract<BlockNode, { type: 'code' }> => child.type === 'code')
  if (!files.length) return node

  const tabs = files.map((file, index) => ({
    slug: `file-${index}`,
    name: file.title || file.file || 'Untitled',
  }))

  return {
    ...node,
    properties: {
      ...node.properties,
      'data-attributes': JSON.stringify({ tabs }),
      'data-files-meta': JSON.stringify({
        files: files.map(file => ({
          title: file.title || file.file || 'Untitled',
          code: file.value,
          language: file.lang ?? 'plaintext',
        })),
      }),
    },
    children: files.map((file, index): ComponentNode => ({
      type: 'component',
      name: 'tab-panel',
      tagName: 'md-tab-panel',
      attributes: {},
      properties: {
        'data-tab-slug': tabs[index]!.slug,
        'data-tab-index': `${index}`,
      },
      children: [file],
    })),
  }
}

export function transformPackageManagerTabs(node: ComponentNode): ComponentNode {
  // Shared lines live under the empty key and are also appended to every framework group in source order.
  const packagesByFramework: Record<string, string[][]> = Object.create(null)
  const shared: string[][] = (packagesByFramework[''] = [])

  // A framework prefix is a word followed by a colon that does not start a URL or path, so `react:pkg`
  // and `react: pkg` are framework lines while `https://host/pkg.tgz` and `file:../pkg` are shared commands.
  for (const [, framework, rest] of blocksToText(node.children).matchAll(/^(?:\s*([\w-]+)\s*:(?![/.]))?(.*)/gm)) {
    const packages = rest!.match(/\S+/g)
    if (!packages) continue
    if (framework) (packagesByFramework[framework.toLowerCase()] ??= shared.slice()).push(packages)
    else for (const key in packagesByFramework) packagesByFramework[key]!.push(packages)
  }

  if (!shared.length) delete packagesByFramework['']
  if (!Object.keys(packagesByFramework).length) return node

  return {
    ...node,
    properties: {
      ...node.properties,
      'data-package-manager-meta': JSON.stringify({
        packagesByFramework,
        mode: resolveInstallMode(node.attributes.mode),
      }),
    },
    children: [],
  }
}

export function transformBundlerTabs(node: ComponentNode): ComponentNode {
  const sections = splitByHeading(node.children)
  const selected = (['vite', 'rsbuild'] as const).flatMap(bundler => {
    const section = sections.find(section => section.name.toLowerCase() === bundler)
    return section ? [{ ...section, name: bundler }] : []
  })
  if (!selected.length) return node

  const tabs = selected.map(section => ({ slug: section.name, name: section.name }))

  return {
    ...node,
    properties: {
      ...node.properties,
      'data-attributes': JSON.stringify({ tabs }),
      'data-bundler-meta': JSON.stringify({ bundlers: selected.map(section => section.name) }),
    },
    children: selected.map((section, index): ComponentNode => {
      return {
        type: 'component',
        name: 'tab-panel',
        tagName: 'md-tab-panel',
        attributes: {},
        properties: {
          'data-tab-slug': section.name,
          'data-tab-index': `${index}`,
          'data-content': section.children.length === 1 && section.children[0]?.type === 'code' ? 'code-only' : 'mixed',
        },
        children: section.children,
      }
    }),
  }
}

export function transformHeadingTabs(node: ComponentNode): ComponentNode {
  const sections = splitByHeading(node.children)
  if (!sections.length) return node

  const tabs = sections.map((section, index) => ({
    slug: section.id || slugify(section.name, `tab-${index + 1}`),
    name: section.name,
  }))

  return {
    ...node,
    properties: {
      ...node.properties,
      'data-attributes': JSON.stringify({ tabs }),
    },
    children: sections.map((section, index): ComponentNode => ({
      type: 'component',
      name: 'tab-panel',
      tagName: 'md-tab-panel',
      attributes: {},
      properties: {
        'data-tab-slug': tabs[index]!.slug,
        'data-tab-index': `${index}`,
      },
      children: section.children,
    })),
  }
}

function resolveInstallMode(value: string | undefined): string {
  const mode = value?.toLowerCase()
  if (mode === 'dev-install' || mode === 'local-install') return mode
  return 'install'
}
