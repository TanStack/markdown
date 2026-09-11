import type { BlockNode, MarkdownDocument, MarkdownExtension, MarkdownHeading } from '../types.js'
import { plainText } from '../utils.js'

export interface HeadingCollectionOptions {
  skipComponentNames?: ReadonlySet<string> | string[]
}

export function headingCollectionExtension(options: HeadingCollectionOptions = {}): MarkdownExtension {
  return {
    name: 'heading-collection',
    transformDocument(document) {
      return {
        ...document,
        headings: collectMarkdownHeadings(document, options),
      }
    },
  }
}

export function collectMarkdownHeadings(document: MarkdownDocument, options: HeadingCollectionOptions = {}): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const skip = new Set(options.skipComponentNames ?? ['tabs'])
  collectFromBlocks(document.children, headings, undefined, skip)
  return headings
}

function collectFromBlocks(
  blocks: BlockNode[],
  headings: MarkdownHeading[],
  framework: string | undefined,
  skipComponentNames: Set<string>,
) {
  for (const block of blocks) {
    if (block.type === 'heading') {
      if (block.id) {
        const heading: MarkdownHeading = {
          id: block.id,
          text: plainText(block.children),
          level: block.depth,
        }
        const headingFramework = block.framework ?? framework
        if (headingFramework) heading.framework = headingFramework
        headings.push(heading)
      }
      continue
    }

    if (block.type === 'list') {
      for (const item of block.items) collectFromBlocks(item.children, headings, framework, skipComponentNames)
      continue
    }

    if (block.type === 'blockquote' || block.type === 'callout') {
      collectFromBlocks(block.children, headings, framework, skipComponentNames)
      continue
    }

    if (block.type === 'component') {
      const name = block.name.toLowerCase()
      if (skipComponentNames.has(name)) continue
      const nextFramework = block.tagName === 'md-framework-panel' ? block.properties?.['data-framework'] ?? framework : framework
      collectFromBlocks(block.children, headings, nextFramework, skipComponentNames)
    }
  }
}
