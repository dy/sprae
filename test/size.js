// verify published size claims match the measured builds (run after `npm run build`)
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const kb = f => gzipSync(readFileSync(new URL('../dist/' + f, import.meta.url)), { level: 9 }).length / 1024

const claims = [
  ['readme.md', /size-([\d.]+)kb-/, 'sprae.umd.js'],
  ['readme.md', /at ([\d.]+)kb compressed/, 'sprae.umd.js'],
  ['index.md', /\*\*([\d.]+)kb, 0 deps\*\*/, 'sprae.umd.js'],
  ['csp.md', /\| size, min\+gzip \| \*\*([\d.]+)kb\*\*/, 'sprae-csp.umd.js'],
]

let fail = 0
for (const [file, re, build] of claims) {
  const m = readFileSync(new URL('../' + file, import.meta.url), 'utf8').match(re), real = kb(build)
  if (!m) console.error(`✗ ${file}: no size claim matching ${re}`), fail = 1
  else if (Math.abs(m[1] - real) > 0.3) console.error(`✗ ${file}: claims ${m[1]}kb, measured ${real.toFixed(1)}kb (${build})`), fail = 1
}
if (!fail) console.log('✓ size claims match measured builds')
process.exit(fail)
