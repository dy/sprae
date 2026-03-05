import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const types = { '.js': 'text/javascript', '.html': 'text/html', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }

const server = createServer(async (req, res) => {
  let path = resolve(root, '.' + req.url.split('?')[0])
  try {
    let body = await readFile(path)
    res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404)
    res.end()
  }
})

await new Promise(r => server.listen(0, r))
const port = server.address().port

const browser = await chromium.launch()
const page = await browser.newPage()

let fail = 0, _done, finished = new Promise(r => _done = r)

page.on('console', msg => {
  let text = msg.text().replace(/%c/g, '').replace(/ color: #[0-9a-f]+/g, '').trim()
  if (!text) return
  console.log(text)
  let m = text.match(/^# fail (\d+)/)
  if (m) { fail = +m[1]; _done() }
})

page.on('pageerror', e => console.error('Page error:', e.message))

await page.goto(`http://localhost:${port}/test/index.html`)
await Promise.race([finished, new Promise(r => setTimeout(r, 60000))])
await new Promise(r => setTimeout(r, 300))

await browser.close()
server.close()
process.exit(fail ? 1 : 0)
