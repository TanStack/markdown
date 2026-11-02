import { stripIndent } from './utils.js'

/** Private line storage. A block callback permanently switches to its mutable array. */
export class SourceLines {
  private starts: number[] = []
  private values: string[] | undefined
  private source = ''

  constructor(input: string | string[]) {
    if (typeof input !== 'string') this.values = input
    else {
      this.source = input
      this.starts.push(0)
      for (let offset = input.indexOf('\n'); offset !== -1; offset = input.indexOf('\n', offset + 1)) {
        this.starts.push(offset + 1)
      }
    }
  }

  get length(): number {
    return this.values?.length ?? this.starts.length
  }

  at(index: number): string | undefined {
    if (this.values) return this.values[index]
    const start = this.starts[index]
    if (start === undefined) return undefined
    const end = this.source.indexOf('\n', start)
    return this.source.slice(start, end === -1 ? undefined : end)
  }

  all(): string[] {
    return this.values ??= this.starts.map((_, index) => this.at(index)!)
  }

  slice(start: number, end = this.length): string[] {
    const result: string[] = []
    for (let index = start; index < end; index++) result.push(this.at(index)!)
    return result
  }

  select(indices: number[]): SourceLines {
    if (this.values) this.values = indices.map(index => this.values![index]!)
    else this.starts = indices.map(index => this.starts[index]!)
    return this
  }

  code(start: number, end: number, indent: number): string {
    if (start === end) return ''
    // Definition extraction retains every line inside a fence. Array callbacks
    // and nested blocks use the fallback, so this range is contiguous source.
    if (!this.values && indent === 0) {
      return this.source.slice(this.starts[start], end === this.length ? undefined : this.starts[end]! - 1)
    }
    const lines: string[] = []
    for (let index = start; index < end; index++) lines.push(stripIndent(this.at(index)!, indent))
    return lines.join('\n')
  }
}
