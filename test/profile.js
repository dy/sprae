import { tick } from 'wait-please'
import h from 'hyperf'
import { html as litHtml, render as litRender } from 'lit'
import { repeat } from 'lit/directives/repeat.js'
import alpinePkg from 'alpinejs'
import { createApp as createPetiteVue, reactive } from 'petite-vue'

globalThis.__PROFILE__ = true
document.implementation.hasFeature ||= () => false
const [{ default: sprae, dispose }, { default: Ractive }] = await Promise.all([
  import('../sprae.js'),
  import('ractive'),
])
Ractive.DEBUG = false

const Alpine = alpinePkg.default || alpinePkg.Alpine || alpinePkg

const adjectives = ['pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome', 'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful', 'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive', 'cheap', 'expensive', 'fancy']
const colours = ['red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown', 'white', 'black', 'orange']
const nouns = ['table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie', 'sandwich', 'burger', 'pizza', 'mouse', 'keyboard']

let nextId = 1
const RUNS = 5

const fmtMs = (n) => `${n.toFixed(2)}ms`.padStart(10)
const fmtMem = (n) => `${(n / 1024 / 1024).toFixed(2)}MB`.padStart(10)
const fmtCount = (n) => String(n).padStart(6)
const arrayMutators = new Set(['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'])

function resetId() {
  nextId = 1
}

function buildData(count) {
  const data = []
  for (let i = 0; i < count; i++) {
    data.push({
      id: nextId++,
      label: `${adjectives[Math.round(Math.random() * 1000) % adjectives.length]} ${colours[Math.round(Math.random() * 1000) % colours.length]} ${nouns[Math.round(Math.random() * 1000) % nouns.length]}`,
    })
  }
  return data
}

function median(values) {
  let sorted = [...values].sort((a, b) => a - b)
  let mid = sorted.length >> 1
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function measure(fn) {
  global.gc?.()
  global.gc?.()
  let before = process.memoryUsage().heapUsed
  let t0 = performance.now()
  await fn()
  let time = performance.now() - t0
  global.gc?.()
  global.gc?.()
  let after = process.memoryUsage().heapUsed
  return { time, mem: after - before }
}

function createExternalState({ setRows, updateRows, setSelected }) {
  let rows = []
  let selected = null
  let proxy

  const wrapRows = (value = []) => new Proxy(value, {
    get(target, key) {
      let out = target[key]
      if (typeof out !== 'function') return out
      if (!arrayMutators.has(key)) return out.bind(target)
      return (...args) => {
        let result = Array.prototype[key].apply(target, args)
        updateRows(target)
        return result
      }
    },
    set(target, key, value) {
      let out = Reflect.set(target, key, value)
      if (key === 'length' || typeof key === 'string' && !isNaN(key)) updateRows(target)
      return out
    },
  })

  proxy = wrapRows(rows)

  return {
    get rows() {
      return proxy
    },
    set rows(value) {
      rows = value || []
      proxy = wrapRows(rows)
      setRows(rows)
    },
    get selected() {
      return selected
    },
    set selected(value) {
      selected = value
      setSelected(value)
    },
  }
}

function createSpraeApp() {
  resetId()
  const el = h`<div>
    <table class="table table-hover table-striped test-data">
      <tr :each="row in rows" :class="{danger: selected && row.id === selected.id}">
        <td class="col-md-1" :text="row.id"></td>
        <td class="col-md-4"><a :onclick="select(row)" :text="row.label"></a></td>
        <td class="col-md-1"><span :onclick="remove(row)" class="glyphicon glyphicon-remove"></span></td>
        <td class="col-md-6"></td>
      </tr>
    </table>
  </div>`

  const state = sprae(el, {
    rows: [],
    selected: null,
    select(row) { this.selected = row },
    remove(row) {
      const idx = this.rows.findIndex(item => item.id === row.id)
      if (idx > -1) this.rows.splice(idx, 1)
    },
  })

  document.body.appendChild(el)

  return {
    state,
    destroy() {
      dispose(el)
      el.remove()
    },
  }
}

function createAlpineApp() {
  resetId()
  const el = h`<div x-data>
    <table class="table table-hover table-striped test-data">
      <template x-for="row in rows" :key="row.id">
        <tr :class="{danger: selected && row.id === selected.id}">
          <td class="col-md-1" x-text="row.id"></td>
          <td class="col-md-4"><a @click="selected = row" x-text="row.label"></a></td>
          <td class="col-md-1"><span @click="rows = rows.filter(item => item.id !== row.id)" class="glyphicon glyphicon-remove"></span></td>
          <td class="col-md-6"></td>
        </tr>
      </template>
    </table>
  </div>`

  const state = Alpine.reactive({ rows: [], selected: null })
  el._x_dataStack = [state]
  Alpine.initTree(el)
  document.body.appendChild(el)

  return {
    state,
    destroy() {
      el.remove()
    },
  }
}

function createPetiteVueApp() {
  resetId()
  const el = h`<div>
    <table class="table table-hover table-striped test-data">
      <tr v-for="row in rows" :key="row.id" :class="{danger: selected && row.id === selected.id}">
        <td class="col-md-1">{{ row.id }}</td>
        <td class="col-md-4"><a @click="selected = row">{{ row.label }}</a></td>
        <td class="col-md-1"><span @click="rows = rows.filter(item => item.id !== row.id)" class="glyphicon glyphicon-remove"></span></td>
        <td class="col-md-6"></td>
      </tr>
    </table>
  </div>`

  const state = reactive({ rows: [], selected: null })
  createPetiteVue(state).mount(el)
  document.body.appendChild(el)

  return {
    state,
    destroy() {
      el.remove()
    },
  }
}

function createLitApp() {
  resetId()
  const el = document.createElement('div')
  let state

  const update = () => litRender(litHtml`<div>
    <table class="table table-hover table-striped test-data">
      ${repeat(state.rows, row => row.id, row => litHtml`
        <tr class=${state.selected && row.id === state.selected.id ? 'danger' : ''}>
          <td class="col-md-1">${row.id}</td>
          <td class="col-md-4"><a @click=${() => { state.selected = row }}>${row.label}</a></td>
          <td class="col-md-1"><span @click=${() => {
            const idx = state.rows.indexOf(row)
            if (idx > -1) state.rows.splice(idx, 1)
          }} class="glyphicon glyphicon-remove"></span></td>
          <td class="col-md-6"></td>
        </tr>
      `)}
    </table>
  </div>`, el)

  state = createExternalState({
    setRows: update,
    updateRows: update,
    setSelected: update,
  })

  update()
  document.body.appendChild(el)

  return {
    state,
    destroy() {
      litRender(null, el)
      el.remove()
    },
  }
}

function createRactiveApp() {
  resetId()
  const el = document.createElement('div')
  const app = new Ractive({
    target: el,
    template: `<div>
      <table class="table table-hover table-striped test-data">
        {{#each rows}}
          <tr class="{{selected && id === selected.id ? 'danger' : ''}}">
            <td class="col-md-1">{{id}}</td>
            <td class="col-md-4"><a on-click="select(@index)">{{label}}</a></td>
            <td class="col-md-1"><span on-click="remove(@index)" class="glyphicon glyphicon-remove"></span></td>
            <td class="col-md-6"></td>
          </tr>
        {{/each}}
      </table>
    </div>`,
    data: {
      rows: [],
      selected: null,
      select(i) {
        this.set('selected', this.get('rows')[i])
      },
      remove(i) {
        this.splice('rows', i, 1)
      },
    },
  })

  const state = createExternalState({
    setRows(rows) {
      app.set('rows', rows)
    },
    updateRows() {
      app.update('rows')
    },
    setSelected(selected) {
      app.set('selected', selected)
    },
  })

  document.body.appendChild(el)

  return {
    state,
    destroy() {
      app.teardown()
      el.remove()
    },
  }
}

async function runCase(factory, setup, action, warmups = 0, runs = RUNS) {
  const times = []
  const mems = []

  for (let i = 0; i < warmups + runs; i++) {
    const app = factory()
    await setup(app.state)
    const result = await measure(() => action(app.state))
    app.destroy()

    if (i >= warmups) {
      times.push(result.time)
      mems.push(result.mem)
    }
  }

  return {
    time: median(times),
    mem: median(mems),
    samples: times.length,
  }
}

async function profileSpraeCreate(rows) {
  const app = createSpraeApp()
  globalThis.__spraeProfile = Object.create(null)
  const data = buildData(rows)
  const result = await measure(async () => {
    app.state.rows = data
    await tick(8)
  })
  const stats = globalThis.__spraeProfile
  delete globalThis.__spraeProfile
  app.destroy()
  return { result, stats }
}

async function profileSpraeCase(setup, action) {
  const app = createSpraeApp()
  await setup(app.state)
  globalThis.__spraeProfile = Object.create(null)
  const result = await measure(() => action(app.state))
  const stats = globalThis.__spraeProfile
  delete globalThis.__spraeProfile
  app.destroy()
  return { result, stats }
}

function printComparison(name, results) {
  console.log(`\n${name}`)
  console.log('framework         time       memory   samples')
  for (const [framework, result] of Object.entries(results)) {
    console.log(`${framework.padEnd(14)}${fmtMs(result.time)}${fmtMem(result.mem)}${fmtCount(result.samples)}`)
  }
}

function printProfile(name, stats, total) {
  console.log(`\nsprae profile: ${name}`)
  console.log(`total create time ${fmtMs(total.time)} retained ${fmtMem(total.mem)}`)
  console.log('bucket            time      count    avg')

  for (const [bucket, stat] of Object.entries(stats).sort((a, b) => b[1].time - a[1].time)) {
    console.log(`${bucket.padEnd(14)}${fmtMs(stat.time)}${fmtCount(stat.count)}${fmtMs(stat.time / stat.count)}`)
  }
}

async function compare(name, runners) {
  const results = {}
  for (const [framework, run] of Object.entries(runners)) {
    results[framework] = await run()
  }
  printComparison(name, results)
}

console.log('Approximate js-framework-benchmark-style perf in Happy DOM')
console.log('This is useful for local comparisons and profiling, but it is not a Chrome timeline run.')

await compare('Create 1,000 rows', {
  sprae: () => runCase(createSpraeApp, async () => {}, async state => { state.rows = buildData(1000); await tick(8) }),
  alpine: () => runCase(createAlpineApp, async () => {}, async state => { state.rows = buildData(1000); await tick(8) }),
  'petite-vue': () => runCase(createPetiteVueApp, async () => {}, async state => { state.rows = buildData(1000); await tick(8) }),
  ractive: () => runCase(createRactiveApp, async () => {}, async state => { state.rows = buildData(1000); await tick(8) }),
  lit: () => runCase(createLitApp, async () => {}, async state => { state.rows = buildData(1000); await tick(8) }),
})

await compare('Create 10,000 rows', {
  sprae: () => runCase(createSpraeApp, async () => {}, async state => { state.rows = buildData(10000); await tick(8) }, 0, 3),
  alpine: () => runCase(createAlpineApp, async () => {}, async state => { state.rows = buildData(10000); await tick(8) }, 0, 3),
  'petite-vue': () => runCase(createPetiteVueApp, async () => {}, async state => { state.rows = buildData(10000); await tick(8) }, 0, 3),
  ractive: () => runCase(createRactiveApp, async () => {}, async state => { state.rows = buildData(10000); await tick(8) }, 0, 3),
  lit: () => runCase(createLitApp, async () => {}, async state => { state.rows = buildData(10000); await tick(8) }, 0, 3),
})

await compare('Replace 1,000 rows', {
  sprae: () => runCase(
    createSpraeApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = buildData(1000); await tick(8) },
    5,
  ),
  alpine: () => runCase(
    createAlpineApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = buildData(1000); await tick(8) },
    5,
  ),
  'petite-vue': () => runCase(
    createPetiteVueApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = buildData(1000); await tick(8) },
    5,
  ),
  ractive: () => runCase(
    createRactiveApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = buildData(1000); await tick(8) },
    5,
  ),
  lit: () => runCase(
    createLitApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = buildData(1000); await tick(8) },
    5,
  ),
})

await compare('Select row', {
  sprae: () => runCase(
    createSpraeApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.selected = state.rows[500]; await tick(8) },
    5,
  ),
  alpine: () => runCase(
    createAlpineApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.selected = state.rows[500]; await tick(8) },
    5,
  ),
  'petite-vue': () => runCase(
    createPetiteVueApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.selected = state.rows[500]; await tick(8) },
    5,
  ),
  ractive: () => runCase(
    createRactiveApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.selected = state.rows[500]; await tick(8) },
    5,
  ),
  lit: () => runCase(
    createLitApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.selected = state.rows[500]; await tick(8) },
    5,
  ),
})

await compare('Remove row', {
  sprae: () => runCase(
    createSpraeApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows.splice(500, 1); await tick(8) },
    5,
  ),
  alpine: () => runCase(
    createAlpineApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows.splice(500, 1); await tick(8) },
    5,
  ),
  'petite-vue': () => runCase(
    createPetiteVueApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows.splice(500, 1); await tick(8) },
    5,
  ),
  ractive: () => runCase(
    createRactiveApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows.splice(500, 1); await tick(8) },
    5,
  ),
  lit: () => runCase(
    createLitApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows.splice(500, 1); await tick(8) },
    5,
  ),
})

await compare('Clear 1,000 rows', {
  sprae: () => runCase(
    createSpraeApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = []; await tick(8) },
    5,
  ),
  alpine: () => runCase(
    createAlpineApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = []; await tick(8) },
    5,
  ),
  'petite-vue': () => runCase(
    createPetiteVueApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = []; await tick(8) },
    5,
  ),
  ractive: () => runCase(
    createRactiveApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = []; await tick(8) },
    5,
  ),
  lit: () => runCase(
    createLitApp,
    async state => { state.rows = buildData(1000); await tick(8) },
    async state => { state.rows = []; await tick(8) },
    5,
  ),
})

await compare('Append 1,000 rows to 10,000', {
  sprae: () => runCase(
    createSpraeApp,
    async state => { state.rows = buildData(10000); await tick(8) },
    async state => { state.rows.push(...buildData(1000)); await tick(8) },
    0,
    3,
  ),
  alpine: () => runCase(
    createAlpineApp,
    async state => { state.rows = buildData(10000); await tick(8) },
    async state => { state.rows.push(...buildData(1000)); await tick(8) },
    0,
    3,
  ),
  'petite-vue': () => runCase(
    createPetiteVueApp,
    async state => { state.rows = buildData(10000); await tick(8) },
    async state => { state.rows.push(...buildData(1000)); await tick(8) },
    0,
    3,
  ),
  ractive: () => runCase(
    createRactiveApp,
    async state => { state.rows = buildData(10000); await tick(8) },
    async state => { state.rows.push(...buildData(1000)); await tick(8) },
    0,
    3,
  ),
  lit: () => runCase(
    createLitApp,
    async state => { state.rows = buildData(10000); await tick(8) },
    async state => { state.rows.push(...buildData(1000)); await tick(8) },
    0,
    3,
  ),
})

const prof1k = await profileSpraeCreate(1000)
const prof10k = await profileSpraeCreate(10000)
const profRemove = await profileSpraeCase(
  async state => { state.rows = buildData(1000); await tick(8) },
  async state => { state.rows.splice(500, 1); await tick(8) },
)
const profClear = await profileSpraeCase(
  async state => { state.rows = buildData(1000); await tick(8) },
  async state => { state.rows = []; await tick(8) },
)

printProfile('create 1,000 rows', prof1k.stats, prof1k.result)
printProfile('create 10,000 rows', prof10k.stats, prof10k.result)
printProfile('remove row', profRemove.stats, profRemove.result)
printProfile('clear 1,000 rows', profClear.stats, profClear.result)
