import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
if (process.argv[2] === '--child') {
  assert.equal(typeof global.gc, 'function')
  const api = await import(pathToFileURL(resolve(process.argv[3])).href)
  api.parseMarkdown('```\nwarm\nup\n```')
  for (let index = 0; index < 3; index++) global.gc()
  const before = process.memoryUsage()
  function parseAndDiscard() {
    const source = '```text\n' + 'x'.repeat(16 * 1024 * 1024) + '\n```\n\n```text\n' + 'retained '.repeat(16) + '\n' + 'retained '.repeat(16) + '\n```'
    const document = api.parseMarkdown(source)
    return document.children.at(-1).value
  }
  globalThis.retainedCode = parseAndDiscard()
  for (let index = 0; index < 5; index++) global.gc()
  const after = process.memoryUsage()
  console.log(JSON.stringify({ before, after, heapDelta: after.heapUsed - before.heapUsed, retainedLength: globalThis.retainedCode.length, outputSHA256: createHash('sha256').update(globalThis.retainedCode).digest('hex'), node: process.version }))
} else {
  const directory = resolve(process.argv[2])
  const baseline = resolve(directory, 'baseline.mjs')
  const candidate = resolve(directory, 'candidate.mjs')
  const hashes = await Promise.all([baseline, candidate].map(async path => createHash('sha256').update(await readFile(path)).digest('hex')))
  const rows = []
  for (const names of [['baseline', 'control', 'candidate'], ['candidate', 'control', 'baseline']]) {
    for (const name of names) {
      const result = JSON.parse(execFileSync(process.execPath, ['--expose-gc', fileURLToPath(import.meta.url), '--child', name === 'candidate' ? candidate : baseline], { encoding: 'utf8', timeout: 60000 }))
      rows.push({ name, ...result })
    }
  }
  assert.equal(new Set(rows.map(row => row.outputSHA256)).size, 1)
  await writeFile(resolve(directory, 'retention.json'), JSON.stringify({ commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), hashes, rows, limitations: 'Separate profiler-free fresh-process retained heap experiment. Holds only a short two-line code value after discarding the full document and source. Control uses identical baseline bundle. Not peak allocation, throughput, cold startup or a general memory claim.' }, null, 2))
  console.log(JSON.stringify(rows.map(({ name, heapDelta, retainedLength }) => ({ name, heapDelta, retainedLength }))))
}
