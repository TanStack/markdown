export function normalizeStaticMarkup(value: string): string {
  return value
    .replace(/<link rel="preload" as="image" href="[^"]*"\s?\/?>/g, '')
    .replace(/\sreadonly=""/g, '')
    .replace(/\sreadOnly=""/g, '')
    .replace(/\sdisabled=""/g, ' disabled')
    .replace(/\schecked=""/g, ' checked')
    .replace(/\s?\/>/g, '>')
    .replace(/&#8617;/g, '\u21a9')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&#(?:96|x60);/gi, '`')
    .replace(/>\s+</g, '><')
    .replace(/\s+(?=<(?:blockquote|div|figure|h[1-6]|hr|ol|p|pre|section|table|ul)\b)/g, '')
}
