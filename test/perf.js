import test, { ok } from 'tst';
import sprae from '../sprae.js';
import { createApp as createPetiteVue, reactive } from 'petite-vue';
import h from 'hyperf';

test('perf: sprae vs petite-vue', async () => {
  // Machine-independent: compare ratio, not absolute time
  // sprae should be no more than 1.1x slower than petite-vue
  const ROWS = 1000, RATIO = 1.1

  const adjectives = ['pretty', 'large', 'big', 'small', 'tall']
  const colours = ['red', 'yellow', 'blue', 'green', 'pink']
  const nouns = ['table', 'chair', 'house', 'desk', 'car']
  let nextId = 1
  const buildData = (n) => Array.from({ length: n }, () => ({
    id: nextId++,
    label: adjectives[Math.random() * 5 | 0] + ' ' + colours[Math.random() * 5 | 0] + ' ' + nouns[Math.random() * 5 | 0]
  }))

  // Sprae
  nextId = 1
  const spraeEl = h`<table><tr :each="row in rows"><td :text="row.id"></td><td :text="row.label"></td></tr></table>`
  const spraeStart = performance.now()
  sprae(spraeEl, { rows: buildData(ROWS) })
  const spraeTime = performance.now() - spraeStart

  // Petite-vue (uses mustache syntax and reactive)
  nextId = 1
  const petiteEl = h`<div><table><tr v-for="row in rows" :key="row.id"><td>{{ row.id }}</td><td>{{ row.label }}</td></tr></table></div>`
  const petiteState = reactive({ rows: buildData(ROWS) })
  const petiteStart = performance.now()
  createPetiteVue(petiteState).mount(petiteEl)
  const petiteTime = performance.now() - petiteStart

  console.log(`  create ${ROWS} rows: sprae=${spraeTime.toFixed(1)}ms petite-vue=${petiteTime.toFixed(1)}ms ratio=${(spraeTime/petiteTime).toFixed(2)}`)
  ok(spraeTime < petiteTime * RATIO, `sprae (${spraeTime.toFixed(1)}ms) should be < ${RATIO}x petite-vue (${petiteTime.toFixed(1)}ms)`)
})
