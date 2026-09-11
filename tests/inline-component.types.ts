import type { BlockNode, InlineComponentNode, InlineNode, UrlTransform } from '../src/index.js'

export const inline: InlineComponentNode = {
  type: 'inlineComponent', name: 'badge', attributes: {}, children: [{ type: 'text', value: 'Ready' }],
}

export const inParagraph: BlockNode = { type: 'paragraph', children: [inline] }

export const invalidInline: InlineComponentNode = {
  type: 'inlineComponent', name: 'badge', attributes: {},
  // @ts-expect-error Inline components cannot contain block children.
  children: [{ type: 'paragraph', children: [] }],
}

// @ts-expect-error Block components are not valid inline nodes.
export const blockInInline: InlineNode = { type: 'component', name: 'block', attributes: {}, children: [] }

export const urlPolicy: UrlTransform = (_url, kind, defaultUrl) => kind === 'image' ? null : defaultUrl

// @ts-expect-error A URL policy must return a string or null, not undefined.
export const invalidUrlPolicy: UrlTransform = () => undefined
