/**
 * Framework Benchmark: sprae vs Alpine.js vs petite-vue
 * Based on js-framework-benchmark operations
 */
import test, { ok } from 'tst'
import { tick } from 'wait-please'
import h from 'hyperf'
import sprae from '../sprae.js'
import alpinePkg from 'alpinejs'
import { createApp as createPetiteVue, reactive } from 'petite-vue'

// Alpine exports nested - get actual module
const Alpine = alpinePkg.default || alpinePkg.Alpine || alpinePkg

// Data helpers
const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy']
const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange']
const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard']

let nextId = 1
function buildData(count) {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push({
      id: nextId++,
      label: adjectives[Math.round(Math.random() * 1000) % adjectives.length] + ' ' + colours[Math.round(Math.random() * 1000) % colours.length] + ' ' + nouns[Math.round(Math.random() * 1000) % nouns.length],
    })
  }
  return data
}
function resetId() { nextId = 1 }

async function measure(fn) {
  global.gc && global.gc() // force GC if available
  const memBefore = process.memoryUsage().heapUsed
  const start = performance.now()
  await fn()
  const time = performance.now() - start
  const memAfter = process.memoryUsage().heapUsed
  const mem = memAfter - memBefore
  return { time, mem }
}

function fmt(ms) { return ms.toFixed(2).padStart(8) + 'ms' }
function fmtMem(bytes) { return (bytes / 1024).toFixed(0).padStart(6) + 'KB' }

// --- App factories ---

function createSpraeApp() {
  resetId()
  const el = h`<div>
    <table>
      <tr :each="row in rows" :class="{selected: selected === row}">
        <td :text="row.id"></td>
        <td><a :onclick="select(row)" :text="row.label"></a></td>
        <td><span :onclick="remove(row)">x</span></td>
      </tr>
    </table>
  </div>`
  const state = sprae(el, {
    rows: [],
    selected: null,
    select(row) { this.selected = row },
    remove(row) {
      const idx = this.rows.findIndex(r => r.id === row.id)
      if (idx > -1) this.rows.splice(idx, 1)
    }
  })
  return { el, state }
}

function createAlpineApp() {
  resetId()
  const el = h`<div x-data>
    <table>
      <template x-for="row in rows" :key="row.id">
        <tr :class="{ selected: selected === row }">
          <td x-text="row.id"></td>
          <td><a @click="selected = row" x-text="row.label"></a></td>
          <td><span @click="rows = rows.filter(r => r.id !== row.id)">x</span></td>
        </tr>
      </template>
    </table>
  </div>`

  // Create reactive state and bind to element
  const state = Alpine.reactive({ rows: [], selected: null })
  el._x_dataStack = [state]
  Alpine.initTree(el)

  return { el, state }
}

function createPetiteVueApp() {
  resetId()
  const el = h`<div>
    <table>
      <tr v-for="row in rows" :key="row.id" :class="{ selected: selected === row }">
        <td>{{ row.id }}</td>
        <td><a @click="selected = row">{{ row.label }}</a></td>
        <td><span @click="rows = rows.filter(r => r.id !== row.id)">x</span></td>
      </tr>
    </table>
  </div>`

  const state = reactive({ rows: [], selected: null })
  createPetiteVue(state).mount(el)

  return { el, state }
}

// --- Comparison helpers ---

function compare(results) {
  const times = Object.values(results).map(r => r.time).filter(t => t != null)
  const mems = Object.values(results).map(r => r.mem).filter(m => m != null)
  const fastestTime = Math.min(...times)
  const leastMem = Math.min(...mems.filter(m => m > 0)) || 1
  let out = ''
  for (const [name, r] of Object.entries(results)) {
    if (r.time == null) {
      out += '\n      ' + name.padEnd(12) + ' error'
    } else {
      const ratio = (r.time / fastestTime).toFixed(2)
      const memRatio = r.mem > 0 ? (r.mem / leastMem).toFixed(1) : '-'
      const marker = r.time === fastestTime ? ' *' : ''
      out += '\n      ' + name.padEnd(12) + fmt(r.time) + marker + '  ' + fmtMem(r.mem) + (memRatio !== '-' && r.mem === leastMem ? ' *' : '')
    }
  }
  return out
}

// --- Benchmark tests ---

test('bench: create 1000 rows', async () => {
  console.log('\n                    time       memory')
  const results = {}

  const s = createSpraeApp()
  const data1 = buildData(1000)
  results.sprae = await measure(async () => { s.state.rows = data1; await tick(8) })

  const a = createAlpineApp()
  const data2 = buildData(1000)
  results.alpine = await measure(async () => { a.state.rows = data2; await tick(8) })

  const p = createPetiteVueApp()
  const data3 = buildData(1000)
  results['petite-vue'] = await measure(async () => { p.state.rows = data3; await tick(8) })

  console.log('\n  create 1000 rows:' + compare(results))
  ok(results.sprae.time < 500, 'sprae < 500ms')
})

test('bench: create 10000 rows', async () => {
  const results = {}

  const s = createSpraeApp()
  const data1 = buildData(10000)
  results.sprae = await measure(async () => { s.state.rows = data1; await tick(8) })

  const a = createAlpineApp()
  const data2 = buildData(10000)
  results.alpine = await measure(async () => { a.state.rows = data2; await tick(8) })

  const p = createPetiteVueApp()
  const data3 = buildData(10000)
  results['petite-vue'] = await measure(async () => { p.state.rows = data3; await tick(8) })

  console.log('\n  create 10000 rows:' + compare(results))
  ok(results.sprae.time < 5000, 'sprae < 5s')
})

test('bench: replace all rows', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  const newData1 = buildData(1000)
  results.sprae = await measure(async () => { s.state.rows = newData1; await tick(8) })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  const newData2 = buildData(1000)
  results.alpine = await measure(async () => { a.state.rows = newData2; await tick(8) })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  const newData3 = buildData(1000)
  results['petite-vue'] = await measure(async () => { p.state.rows = newData3; await tick(8) })

  console.log('\n  replace all rows:' + compare(results))
  ok(results.sprae.time < 500, 'sprae < 500ms')
})

test('bench: partial update', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  results.sprae = await measure(async () => {
    for (let i = 0; i < s.state.rows.length; i += 10) s.state.rows[i].label += ' !!!'
    await tick(8)
  })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  results.alpine = await measure(async () => {
    for (let i = 0; i < a.state.rows.length; i += 10) a.state.rows[i].label += ' !!!'
    await tick(8)
  })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  results['petite-vue'] = await measure(async () => {
    for (let i = 0; i < p.state.rows.length; i += 10) p.state.rows[i].label += ' !!!'
    await tick(8)
  })

  console.log('\n  partial update (every 10th):' + compare(results))
  ok(results.sprae.time < 200, 'sprae < 200ms')
})

test('bench: select row', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  results.sprae = await measure(async () => { s.state.selected = s.state.rows[500]; await tick(8) })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  results.alpine = await measure(async () => { a.state.selected = a.state.rows[500]; await tick(8) })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  results['petite-vue'] = await measure(async () => { p.state.selected = p.state.rows[500]; await tick(8) })

  console.log('\n  select row:' + compare(results))
  ok(results.sprae.time < 50, 'sprae < 50ms')
})

test('bench: swap rows', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  results.sprae = await measure(async () => {
    const tmp = s.state.rows[1]; s.state.rows[1] = s.state.rows[998]; s.state.rows[998] = tmp
    await tick(8)
  })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  results.alpine = await measure(async () => {
    const tmp = a.state.rows[1]; a.state.rows[1] = a.state.rows[998]; a.state.rows[998] = tmp
    await tick(8)
  })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  results['petite-vue'] = await measure(async () => {
    const tmp = p.state.rows[1]; p.state.rows[1] = p.state.rows[998]; p.state.rows[998] = tmp
    await tick(8)
  })

  console.log('\n  swap rows:' + compare(results))
  ok(results.sprae.time < 100, 'sprae < 100ms')
})

test('bench: remove row', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  results.sprae = await measure(async () => { s.state.rows.splice(500, 1); await tick(8) })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  results.alpine = await measure(async () => { a.state.rows.splice(500, 1); await tick(8) })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  results['petite-vue'] = await measure(async () => { p.state.rows.splice(500, 1); await tick(8) })

  console.log('\n  remove row:' + compare(results))
  ok(results.sprae.time < 50, 'sprae < 50ms')
})

test('bench: clear rows', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  results.sprae = await measure(async () => { s.state.rows = []; await tick(8) })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  results.alpine = await measure(async () => { a.state.rows = []; await tick(8) })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  results['petite-vue'] = await measure(async () => { p.state.rows = []; await tick(8) })

  console.log('\n  clear rows:' + compare(results))
  ok(results.sprae.time < 100, 'sprae < 100ms')
})

test('bench: append 1000 rows', async () => {
  const results = {}

  const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
  const newData1 = buildData(1000)
  results.sprae = await measure(async () => { s.state.rows.push(...newData1); await tick(8) })

  const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
  const newData2 = buildData(1000)
  results.alpine = await measure(async () => { a.state.rows.push(...newData2); await tick(8) })

  const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
  const newData3 = buildData(1000)
  results['petite-vue'] = await measure(async () => { p.state.rows.push(...newData3); await tick(8) })

  console.log('\n  append 1000 rows:' + compare(results))
  ok(results.sprae.time < 500, 'sprae < 500ms')
})

test('bench: scaling', async () => {
  const sizes = [100, 200, 400, 800]
  console.log('\n  scaling (append to 1000 rows):')
  console.log('      size     | sprae      | alpine     | petite-vue')
  console.log('      ---------|------------|------------|------------')

  for (const size of sizes) {
    const results = {}

    const s = createSpraeApp(); s.state.rows = buildData(1000); await tick(8)
    const d1 = buildData(size)
    results.sprae = await measure(async () => { s.state.rows.push(...d1); await tick(8) })

    const a = createAlpineApp(); a.state.rows = buildData(1000); await tick(8)
    const d2 = buildData(size)
    results.alpine = await measure(async () => { a.state.rows.push(...d2); await tick(8) })

    const p = createPetiteVueApp(); p.state.rows = buildData(1000); await tick(8)
    const d3 = buildData(size)
    results['petite-vue'] = await measure(async () => { p.state.rows.push(...d3); await tick(8) })

    console.log('      ' + String(size).padStart(4) + '     |' + fmt(results.sprae.time) + '  |' + fmt(results.alpine.time) + '  |' + fmt(results['petite-vue'].time))
  }
  ok(true, 'scaling complete')
})
