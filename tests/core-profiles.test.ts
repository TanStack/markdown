import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { expect, it } from 'vitest'

it('retains readable CPU/allocation profiles and completed-output metadata', () => {
  const root = mkdtempSync(join(tmpdir(), 'markdown-profile-'))
  const directory = join(root, 'profiles')
  try {
    execFileSync(process.execPath, ['--expose-gc', 'scripts/profile-core.mjs', directory, '--smoke'], { timeout: 15000, stdio: 'pipe' })
    const receipt = JSON.parse(readFileSync(join(directory, 'summary.json'), 'utf8'))
    expect(receipt.smoke).toBe(true)
    expect(receipt.sourceStable).toBe(true)
    expect(receipt.runtime).toBe('native-js')
    expect(receipt.compilerVersion).toMatch(/^\d+\.\d+\.\d+/)
    const parserBytes = readFileSync(join(directory, 'runtime/parser.js'))
    expect(receipt.runtimeModules['parser.js']).toBe(createHash('sha256').update(parserBytes).digest('hex'))
    expect(() => execFileSync(process.execPath, ['--expose-gc', '--import', 'tsx', 'scripts/profile-core.mjs', join(root, 'instrumented'), '--smoke'], { timeout: 15000, stdio: 'pipe' })).toThrow('without module loaders or preload hooks')
    expect(receipt.programSHA256).toMatch(/^[a-f0-9]{64}$/)
    expect(receipt.sources).toHaveProperty("src/parser.ts")
    expect(receipt.rows).toHaveLength(4)
    expect(receipt.commit).toMatch(/^[a-f0-9]{40}$/)
    const preservedSummary = readFileSync(join(directory, 'summary.json'), 'utf8')
    expect(() => execFileSync(process.execPath, ['--expose-gc', 'scripts/profile-core.mjs', directory, '--smoke'], { timeout: 15000, stdio: 'pipe' })).toThrow('Output directory already exists')
    expect(readFileSync(join(directory, 'summary.json'), 'utf8')).toBe(preservedSummary)
    for (const row of receipt.rows) {
      expect(row.cpuCompletedOperations).toBeGreaterThan(0)
      expect(row.allocationIterations).toBe(5)
      expect(row.outputSHA256).toMatch(/^[a-f0-9]{64}$/)
      if (row.name.endsWith('-stream')) expect(row.streamTraceSHA256).toMatch(/^[a-f0-9]{64}$/)
      const cpu = JSON.parse(readFileSync(join(directory, row.name + '.cpuprofile'), 'utf8'))
      expect(cpu.nodes.length).toBeGreaterThan(0)
      expect(cpu.nodes.some((node: { callFrame: { functionName: string; url?: string } }) => node.callFrame.functionName === '__name' && node.callFrame.url?.includes('/runtime/'))).toBe(false)
      expect(cpu.samples.length).toBe(cpu.timeDeltas.length)
      const heap = JSON.parse(gunzipSync(readFileSync(join(directory, row.name + '.heapprofile.json.gz'))).toString())
      expect(heap.head.callFrame).toBeDefined()
      expect(Array.isArray(heap.samples)).toBe(true)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}, 20000)
