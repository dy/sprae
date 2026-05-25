// Verify the js-framework-benchmark scenario for sprae against the actual
// upstream template (vendored verbatim in test/jfb/), to catch performance
// regressions that don't reproduce in happy-dom.
//
// Usage:
//   npm run build && node test/verify-jfb.js [path/to/sprae.js]
//   default sprae build: ./dist/sprae.js
//
// Aborts (declares "hung") if any single op exceeds 30s — the same threshold
// the krausest benchmark harness uses to call a framework broken.
// Also runs upstream isKeyed mutation checks (swap / recreate / remove).
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import keyedDetector from './jfb/keyed-detector.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURE = resolve(__dirname, 'jfb')
const SPRAE = process.argv[2] || resolve(__dirname, '..', 'dist', 'sprae.js')
const TIMEOUT = 30000
const types = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' }

const server = createServer(async (req, res) => {
  let url = req.url.split('?')[0]
  if (url === '/') url = '/index.html'
  if (url === '/css/currentStyle.css') return (res.writeHead(200, { 'content-type': 'text/css' }), res.end(''))
  if (url === '/favicon.ico') return (res.writeHead(204), res.end())
  if (url === '/src/sprae.js') return (res.writeHead(200, { 'content-type': 'text/javascript' }), res.end(await readFile(SPRAE)))
  let path = resolve(FIXTURE, '.' + url), body
  try { body = await readFile(path) } catch { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' })
  res.end(body)
})
await new Promise(r => server.listen(0, r))
const port = server.address().port

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('pageerror', e => console.error('  page error:', e.message))
await page.goto(`http://localhost:${port}/`)
await page.waitForSelector('#run', { state: 'attached' })

console.log(`  sprae build: ${SPRAE}`)

const ops = [
  ['create 1k    ', '#run'],
  ['clear        ', '#clear'],
  ['create 1k #2 ', '#run'],
  ['clear        ', '#clear'],
  ['create 10k   ', '#runlots'],
  ['clear 10k    ', '#clear'],
  ['create 10k #2', '#runlots'],
  ['update 10th  ', '#update'],
  ['swap         ', '#swaprows'],
  ['append 1k    ', '#add'],
  ['clear        ', '#clear'],
]

let hung = false
for (const [label, sel] of ops) {
  const start = Date.now()
  let timedOut = false
  try {
    await Promise.race([
      page.click(sel).then(() => page.evaluate(() => new Promise(r => requestAnimationFrame(r)))),
      new Promise((_, rej) => setTimeout(() => { timedOut = true; rej(new Error('timeout')) }, TIMEOUT))
    ])
  } catch {}
  const t = Date.now() - start
  const flag = timedOut ? ` ⚠ TIMEOUT (>${TIMEOUT}ms)` : t > 1000 ? ' ⚠ slow' : ''
  console.log(`  ${label}  ${t.toString().padStart(6)}ms${flag}`)
  if (timedOut) { hung = true; break }
}

const check = (name, ok, detail = '') => {
  console.log(`  isKeyed ${name.padEnd(7)}${ok ? 'OK' : 'FAIL' + (detail ? ` (${detail})` : '')}`)
  return ok
}

let keyedFail = false
try {
  await page.goto(`http://localhost:${port}/`)
  await page.waitForSelector('#run', { state: 'attached' })
  await page.evaluate(keyedDetector)
  await page.click('#add')
  await page.waitForFunction(() => document.querySelectorAll('tbody tr').length === 1000)
  await page.evaluate('window.nonKeyedDetector_instrument()')

  await page.evaluate('nonKeyedDetector_storeTr()')
  await page.click('#swaprows')
  await page.waitForFunction(() => document.querySelector('tbody>tr:nth-of-type(2)>td:nth-of-type(1)')?.textContent === '999')
  let { tradded, trremoved, newNodes } = await page.evaluate('nonKeyedDetector_result()')
  if (!check('swap', tradded > 0 && trremoved > 0 && newNodes === 0, `${tradded}+ ${trremoved}- ${newNodes} new`)) keyedFail = true

  await page.evaluate('window.nonKeyedDetector_reset()')
  await page.click('#run')
  await page.waitForFunction(() => document.querySelector('tbody>tr:nth-of-type(1000)>td:nth-of-type(1)')?.textContent === '2000')
  ;({ tradded, trremoved } = await page.evaluate('nonKeyedDetector_result()'))
  if (!check('run', tradded >= 1000 && trremoved >= 1000, `${tradded}+ ${trremoved}-`)) keyedFail = true

  await page.evaluate('nonKeyedDetector_storeTr(); window.nonKeyedDetector_reset()')
  await page.evaluate(() => document.querySelector('tbody>tr:nth-of-type(2)>td:nth-of-type(3)>a').click())
  await page.waitForFunction(() => document.querySelector('tbody>tr:nth-of-type(2)>td:nth-of-type(1)')?.textContent === '1003')
  if (!check('remove', (await page.evaluate('nonKeyedDetector_result()')).removedStoredTr)) keyedFail = true
} catch (e) {
  console.error('  isKeyed error:', e.message)
  keyedFail = true
}

await browser.close()
server.close()
if (keyedFail) console.log('  → NOT KEYED (run npm run isKeyed in js-framework-benchmark before PR)')
console.log(hung ? '  → HUNG' : keyedFail ? '  → KEYED CHECK FAILED' : '  → OK')
process.exit(hung || keyedFail ? 1 : 0)
