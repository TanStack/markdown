import { build } from 'esbuild'
import { chromium } from 'playwright'

const bundle = await build({
  entryPoints: ['tests/browser/streaming.tsx'], bundle: true, write: false,
  minify: true, platform: 'browser', format: 'iife', target: 'es2022', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
})
const browser = await chromium.launch({ headless: true, ...(process.env.BENCH_BROWSER_CHANNEL ? { channel: process.env.BENCH_BROWSER_CHANNEL } : {}) })
try {
  const page = await browser.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.setContent('<!doctype html><meta charset="utf-8"><body></body>')
  await page.addScriptTag({ content: bundle.outputFiles[0]!.text })
  console.log(await page.evaluate(() => window.verifyStreamingReact()))
  if (errors.length) throw new Error(errors.join('\n'))
} finally {
  await browser.close()
}
