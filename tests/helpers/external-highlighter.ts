import type { CodeHighlightOptions } from '../../src/index.js'

export function externalHighlighter(code: string, lang = 'plaintext', options: CodeHighlightOptions = {}): string {
  return code
    .split('\n')
    .map((line, index) => {
      const number = index + 1
      const classes = ['external-line']
      if (options.highlightLines?.includes(number)) classes.push('external-line-highlight')
      const lineNumber = options.lineNumbers ? `<span class="external-line-number">${number}</span>` : ''
      return `<span class="${classes.join(' ')}" data-lang="${lang}" data-line="${number}">${lineNumber}${escapeHtml(line)}</span>`
    })
    .join('\n')
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&#39;'
    }
  })
}
