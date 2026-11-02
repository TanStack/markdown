import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
if (process.argv[2] === '--child') {
  assert.equal(typeof global.gc, 'function')
  const api = await import(pathToFileURL(resolve(process.argv[3])).href)
  api.renderHtml({ type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'warm' }, { type: 'text', value: 'up' }] }] })
  for (let index = 0; index < 3; index++) global.gc()
  const before = process.memoryUsage()
  function renderAndDiscard() {
    const source = 'x'.repeat(16 * 1024 * 1024) + 'a'.repeat(128) + 'b'.repeat(128)
    return api.renderHtml({ type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', value: source.slice(-256, -128) }, { type: 'text', value: source.slice(-128) }] }] })
  }
  globalThis.retainedHtml = renderAndDiscard()
  for (let index = 0; index < 5; index++) global.gc()
  const after = process.memoryUsage()
  const outputSHA256 = createHash('sha256').update(globalThis.retainedHtml).digest('hex')
  for (let index = 0; index < 5; index++) global.gc()
  const afterConsume = process.memoryUsage()
  console.log(JSON.stringify({ before, after, afterConsume, heapDelta: after.heapUsed - before.heapUsed, afterConsumeHeapDelta: afterConsume.heapUsed - before.heapUsed, retainedLength: globalThis.retainedHtml.length, outputSHA256, node: process.version }))
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
  await writeFile(resolve(directory, 'retention.json'), JSON.stringify({ commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), hashes, rows, limitations: 'Separate profiler-free fresh-process retained heap experiment. Holds only complete returned HTML after discarding a valid manual AST with two short substring values backed by a16MiB parent source. Reports retained heap before and after UTF8 hash consumption. Rope retention and flattening are separate from throughput; no incomplete-output benchmark is accepted. Control uses identical baseline bundle. Not peak allocation, throughput, cold startup or a general memory claim.' }, null, 2))
  console.log(JSON.stringify(rows.map(({ name, heapDelta, retainedLength }) => ({ name, heapDelta, retainedLength }))))
}
