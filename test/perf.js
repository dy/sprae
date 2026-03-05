import test, { ok } from 'tst';
import { tick } from 'wait-please';
import sprae, { dispose } from '../sprae.js';
import { _dispose } from '../core.js';
import { createApp as createPetiteVue, reactive } from 'petite-vue';
import h from 'hyperf';

test('perf: sprae vs petite-vue', async () => {
  // Machine-independent: compare ratio, not absolute time
  // Core should be competitive with petite-vue; jessie/preact have overhead
  const ROWS = 1000, RUNS = 3
  const RATIO = 1.2

  const adjectives = ['pretty', 'large', 'big', 'small', 'tall']
  const colours = ['red', 'yellow', 'blue', 'green', 'pink']
  const nouns = ['table', 'chair', 'house', 'desk', 'car']
  let nextId = 1
  const buildData = (n) => Array.from({ length: n }, () => ({
    id: nextId++,
    label: adjectives[Math.random() * 5 | 0] + ' ' + colours[Math.random() * 5 | 0] + ' ' + nouns[Math.random() * 5 | 0]
  }))

  // Run multiple times, take best ratio (reduces CPU variance)
  let bestRatio = Infinity
  for (let run = 0; run < RUNS; run++) {
    // Sprae
    nextId = 1
    const spraeEl = h`<table><tr :each="row in rows"><td :text="row.id"></td><td :text="row.label"></td></tr></table>`
    const spraeStart = performance.now()
    sprae(spraeEl, { rows: buildData(ROWS) })
    const spraeTime = performance.now() - spraeStart

    // Petite-vue
    nextId = 1
    const petiteEl = h`<div><table><tr v-for="row in rows" :key="row.id"><td>{{ row.id }}</td><td>{{ row.label }}</td></tr></table></div>`
    const petiteState = reactive({ rows: buildData(ROWS) })
    const petiteStart = performance.now()
    createPetiteVue(petiteState).mount(petiteEl)
    const petiteTime = performance.now() - petiteStart

    const ratio = spraeTime / petiteTime
    if (ratio < bestRatio) bestRatio = ratio
  }

  console.log(`  create ${ROWS} rows (best of ${RUNS}): ratio=${bestRatio.toFixed(2)}`)
  ok(bestRatio < RATIO, `best ratio (${bestRatio.toFixed(2)}) should be < ${RATIO}`)
})

test('perf: memory stable after create+dispose cycles', { skip: !global.gc }, async () => {
  const CYCLES = 100

  async function cycle() {
    let el = h`<div :scope="{x:1}">
      <span :each="item in items" :text="item"></span>
      <template :if="show"><b :text="x"></b></template>
      <button :onclick="() => x++"></button>
    </div>`
    sprae(el, { items: [1, 2, 3, 4, 5], show: true })
    await tick(4)
    el[_dispose]()
  }

  for (let i = 0; i < 10; i++) await cycle()
  global.gc(); global.gc()
  const baseline = process.memoryUsage().heapUsed

  for (let i = 0; i < CYCLES; i++) await cycle()
  global.gc(); global.gc()
  const mid = process.memoryUsage().heapUsed

  for (let i = 0; i < CYCLES; i++) await cycle()
  global.gc(); global.gc()
  const after = process.memoryUsage().heapUsed

  const drift = after - mid
  const driftKB = (drift / 1024).toFixed(0)
  console.log(`  ${CYCLES}→${2*CYCLES} cycles drift: ${driftKB}KB`)
  ok(Math.abs(drift) < 256 * 1024, `memory drift ${driftKB}KB should be < 256KB`)
})
