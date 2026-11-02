import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { expect, it } from 'vitest'

it('retains readable CPU/allocation profiles and completed-output metadata', () => {
  const directory = mkdtempSync(join(tmpdir(), 'markdown-profile-'))
  try {
    execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', 'scripts/profile-core.mjs', directory, '--smoke'], { timeout: 15000, stdio: 'pipe' })
    const receipt = JSON.parse(readFileSync(join(directory, 'summary.json'), 'utf8'))
    expect(receipt.smoke).toBe(true)
    expect(receipt.rows).toHaveLength(4)
    expect(receipt.commit).toMatch(/^[a-f0-9]{40}$/)
    for (const row of receipt.rows) {
      expect(row.cpuCompletedOperations).toBeGreaterThan(0)
      expect(row.allocationIterations).toBe(5)
      expect(row.outputSHA256).toMatch(/^[a-f0-9]{64}$/)
      const cpu = JSON.parse(readFileSync(join(directory, row.name + '.cpuprofile'), 'utf8'))
      expect(cpu.nodes.length).toBeGreaterThan(0)
      expect(cpu.samples.length).toBe(cpu.timeDeltas.length)
      const heap = JSON.parse(gunzipSync(readFileSync(join(directory, row.name + '.heapprofile.json.gz'))).toString())
      expect(heap.head.callFrame).toBeDefined()
      expect(Array.isArray(heap.samples)).toBe(true)
    }
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}, 20000)
