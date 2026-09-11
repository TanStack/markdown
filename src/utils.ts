import type { InlineNode, LinkReferenceDefinition } from './types.js'

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
}

const escapeCharacter = (char: string) => htmlEscapes[char]!

export function normalizeInput(value: string): string {
  return value.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, escapeCharacter)
}

export function escapeAttr(value: string): string {
  return value.replace(/[&<>"'`]/g, escapeCharacter)
}

export function isBlank(value: string): boolean {
  return /^\s*$/.test(value)
}

export function stripIndent(value: string, size: number): string {
  let index = 0
  while (index < value.length && index < size && value[index] === ' ') index++
  return value.slice(index)
}

export function plainText(nodes: InlineNode[]): string {
  let value = ''
  for (const node of nodes) {
    if (node.type === 'text' || node.type === 'inlineCode') value += node.value
    else if ('children' in node) value += plainText(node.children)
    else if (node.type === 'image') value += node.alt
  }
  return value
}

export function createSlugger(normalize = headingSlug) {
  const seen = new Map<string, number>()

  return (value: string) => {
    const base = normalize(value)
    let count = seen.get(base) ?? 1
    let id = base
    while (seen.has(id)) id = `${base}-${++count}`
    seen.set(base, count)
    seen.set(id, 1)
    return id
  }
}

function headingSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&[a-z0-9#]+;/gi, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'
}

export function sanitizeUrl(value: string): string {
  const trimmed = value.replace(/[\u0000-\u001F\u007F\s]+/g, '')
  return /^(?!https?:|mailto:|tel:)[a-z][a-z0-9+.-]*:/i.test(trimmed) ? '' : trimmed
}

export function parseDestination(value: string): LinkReferenceDefinition | undefined {
  const match = value.match(/^(?:<([^<>\n]*)>|([^<>\s]*?))(?:\s+(?:"([^"]*)"|'([^']*)'|\(([^)]*)\)))?$/)
  if (!match) return undefined
  const href = match[1] ?? match[2]!
  const title = match[3] ?? match[4] ?? match[5]
  return { href: href.replace(/\\([!-/:-@\[-`{-~])/g, '$1'), ...(title ? { title } : {}) }
}

export function normalizeReferenceLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function footnoteId(label: string): string {
  return normalizeReferenceLabel(label)
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'footnote'
}

export function footnoteReferenceId(id: string, index = 1): string {
  return index > 1 ? `${id}-${index}` : id
}

export function splitLines(value: string): string[] {
  const lines = value.split('\n')
  if (lines.at(-1) === '') lines.pop()
  return lines
}
