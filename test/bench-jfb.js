// Measure js-framework-benchmark ops for sprae in real Chromium with CPU throttling.
// Complements verify-jfb.js (correctness smoke) with medians for perf iteration.
//
// Usage:
//   npm run build && node test/bench-jfb.js [pathA.js] [pathB.js] [--samples=N] [--throttle=N] [--fixture=dir]
//   Two builds are interleaved per sample (A/B under identical machine drift).
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const FIXTURE = args.find(a => a.startsWith('--fixture='))?.split('=')[1] || resolve(__dirname, 'jfb')
const paths = args.filter(a => !a.startsWith('--'))
const VARIANTS = (paths.length ? paths : [resolve(__dirname, '..', 'dist', 'sprae.js')])
const SAMPLES = +(args.find(a => a.startsWith('--samples='))?.split('=')[1] || 9)
const THROTTLE = +(args.find(a => a.startsWith('--throttle='))?.split('=')[1] || 4)
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' }

let current = VARIANTS[0]
const server = createServer(async (req, res) => {
  let url = req.url.split('?')[0]
  if (url === '/') url = '/index.html'
  if (url === '/css/currentStyle.css') return (res.writeHead(200, { 'content-type': 'text/css' }), res.end(''))
  if (url === '/favicon.ico') return (res.writeHead(204), res.end())
  if (url === '/src/sprae.js') return (res.writeHead(200, { 'content-type': 'text/javascript' }), res.end(await readFile(current)))
  let path = resolve(FIXTURE, '.' + url), body
  try { body = await readFile(path) } catch { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' })
  res.end(body)
})
await new Promise(r => server.listen(0, r))
const port = server.address().port

// in-page: click target, resolve time to next-next frame (style+layout+paint scheduled)
const MEASURE = (sel) => `new Promise(res => {
  const t0 = performance.now()
  document.querySelector(${JSON.stringify(sel)}).click()
  requestAnimationFrame(() => requestAnimationFrame(() => res(performance.now() - t0)))
})`
const CLICK = (sel) => `new Promise(res => {
  document.querySelector(${JSON.stringify(sel)}).click()
  requestAnimationFrame(() => requestAnimationFrame(() => res()))
})`

// [label, setup selectors (clicked & settled), measured selector] — warmups mirror JFB's "(5 warmup runs)"
const RUN_CLEAR_5 = ['#run', '#clear', '#run', '#clear', '#run', '#clear', '#run', '#clear', '#run', '#clear']
const OPS = [
  ['create 1k', RUN_CLEAR_5, '#run'],
  ['replace 1k', ['#run', '#run', '#run', '#run', '#run'], '#run'],
  ['update 10th', ['#run'], '#update'],
  ['select row', ['#run',
    'tbody>tr:nth-of-type(1)>td:nth-of-type(2)>a', 'tbody>tr:nth-of-type(2)>td:nth-of-type(2)>a',
    'tbody>tr:nth-of-type(3)>td:nth-of-type(2)>a', 'tbody>tr:nth-of-type(4)>td:nth-of-type(2)>a',
    'tbody>tr:nth-of-type(5)>td:nth-of-type(2)>a'],
    'tbody>tr:nth-of-type(6)>td:nth-of-type(2)>a'],
  ['swap rows', ['#run', '#swaprows', '#swaprows', '#swaprows', '#swaprows'], '#swaprows'],
  ['remove row', ['#run'], 'tbody>tr:nth-of-type(500)>td:nth-of-type(3)>a'],
  ['create 10k', RUN_CLEAR_5, '#runlots'],
  ['append 1k', ['#run', '#add', '#add', '#add', '#add', '#add'], '#add'],
  ['clear 1k', ['#run', '#clear', '#run', '#clear', '#run'], '#clear'],
]

const browser = await chromium.launch()
console.log(`fixture: ${FIXTURE}\nvariants: ${VARIANTS.join(' vs ')}\nthrottle: ${THROTTLE}x  samples: ${SAMPLES}`)

const median = a => (a = [...a].sort((x, y) => x - y), a[a.length >> 1])
const results = VARIANTS.map(() => ({}))

for (const [label, setup, target] of OPS) {
  const times = VARIANTS.map(() => [])
  for (let i = 0; i < SAMPLES; i++) {
    for (let vi = 0; vi < VARIANTS.length; vi++) {
      current = VARIANTS[vi]
      const page = await browser.newPage()
      const cdp = await page.context().newCDPSession(page)
      await page.goto(`http://localhost:${port}/`)
      await page.waitForSelector('#run', { state: 'attached' })
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE })
      for (const sel of setup) await page.evaluate(CLICK(sel))
      times[vi].push(await page.evaluate(MEASURE(target)))
      await page.close()
    }
  }
  const meds = times.map(median)
  for (let vi = 0; vi < VARIANTS.length; vi++) results[vi][label] = +meds[vi].toFixed(1)
  console.log(`${label.padEnd(12)} ${meds.map((m, vi) => `${basename(dirname(VARIANTS[vi]))}/${basename(VARIANTS[vi])}: ${m.toFixed(1).padStart(7)}ms`).join('   ')}${meds.length > 1 ? `   Δ ${((meds[1] / meds[0] - 1) * 100).toFixed(1)}%` : ''}`)
}

console.log('\nJSON:', JSON.stringify(results))
await browser.close()
server.close()
