// test signals only (not sprae)

import t, { is } from 'tst'
import { signal, computed, effect, batch } from '../sprae.js'
import { tick } from 'wait-please'

// import * as signals from '@preact/signals-core'
// use(signals)

// value
t('signal: readme', async () => {
  let log = []
  let v1 = signal(0)
  is(v1.value, 0)

  // subscribe
  let unsub = effect(() => log.push(v1.value))

  // set
  v1.value = 1
  await tick()
  is(v1.value, 1)
  // is(log, [0, '-', 1])
  unsub()
  await tick()

  // from value
  let v2 = computed(() => v1 * 2)
  log = []
  effect(() => log.push(v2.value))
  is(log, [2])
  is(v2.value, 2) // > 2
  is(v2.peek(), 2)
  is(v1.value, 1)
  is(log, [2])

  console.log('v1.value = 2')
  v1.value = 2
  await tick()
  is(log, [2, 4], 'no extra values')

  // ignore unchanged
  v1.value = 2
  await tick()
  is(log, [2, 4])

  // initialize value
  let v3 = signal(v1)
  is(v3.value, v1) // v5

  // dispose
  // v2.dispose()
  // ;[v3, v2, v1].map(v => v[Symbol.dispose]())
})

t('signal: callstack trouble', () => {
  let v1 = signal(0)
  let v2 = computed(() => { console.log('v2.compute'); return v1.value })
  effect(() => { console.log('v2.subscribed'), v2.value })
  console.log('---- v1.value = 1')
  v1.value = 1
})

t('signal: core API', async () => {
  // warmup
  let v1 = signal(0)
  let v2 = computed(() => v1 * 2)
  effect(() => (v2.value))
  v1.value = 2

  console.log('---start')
  let s = signal(0)
  let log = []
  effect(() => log.push(s.value))

  is(log, [0], 'should publish the initial state')

  is(+s, 0, 'toPrimitive')
  is(s.valueOf(), 0, 'valueOf')
  is(String(s.toString()), '0', 'toString')
  is(s.value, 0, 's()')


  s.value = 1
  await tick()
  is(+s, 1, 'state.current = value')

  s.value = 2
  await tick()
  is(+s, 2, 'state(value)')
  is(s.value, 2, 'state(value)')

  s.value += 1
  await tick()
  is(s.value, 3, 'state(state + value)')

  // observer 2
  let log2 = []
  effect(() => log2.push(s.value))

  is(log.slice(-1), [3], 'should track and notify first tick changes')
  is(log2, [3], 'should properly init set')
  s.value = 4
  await tick()
  is(log.slice(-1), [4], 'arbitrary change 1')
  s.value = 5
  await tick()
  is(log.slice(-1), [5], 'arbitrary change 2')
  is(log2.slice(-1), [5], 'secondary observer is fine')
})

t.skip('signal: should not expose technical/array symbols', async () => {
  let s = signal({ x: 1 })
  let log = []
  is(s.map, undefined)
  for (let p in s) { log.push(p) }
  is(log, [])
})

t('signal: multiple subscriptions should not inter-trigger', async () => {
  let value = signal(0)
  let log1 = [], log2 = [], log3 = []
  effect(() => log1.push(value.value))
  effect(() => log2.push(value.value))
  is(log1, [0])
  is(log2, [0])
  value.value = 1
  await tick()
  is(log1, [0, 1])
  is(log2, [0, 1])
  effect(() => log3.push(value.value))
  is(log1, [0, 1])
  is(log2, [0, 1])
  is(log3, [1])
  value.value = 2
  await tick()
  is(log1, [0, 1, 2])
  is(log2, [0, 1, 2])
  is(log3, [1, 2])
})

t('signal: stores arrays', async () => {
  let a = signal([])
  is(a.value, [])
  a.value = [1]
  is(a.value, [1])
  a.value = [1, 2]
  is(a.value, [1, 2])
  a.value = []
  is(a.value, [])

  let b = signal(0)
  a = signal([b])
  is(a.value, [b])
  b.value = 1
  is(a.value, [b])
  a.value = [b.value]
  is(a.value, [1])
})

t('signal: stringify', async () => {
  let v1 = signal(1), v2 = signal({ x: 1 }), v3 = signal([1, 2, 3])
  is(JSON.stringify(v1), '1')
  is(JSON.stringify(v2), `{"x":1}`)
  is(JSON.stringify(v3), '[1,2,3]')
})

t('signal: subscribe value', async () => {
  let v1 = signal(1), log = []
  effect(() => log.push(v1.value))
  is(log, [1])
  console.log('set 2')
  v1.value = 2
  await tick()
  is(log, [1, 2])
})

t('signal: internal effects', async () => {
  const s1 = signal(1), s2 = signal(2)
  let log1 = [], log2 = []

  effect(() => {
    log1.push(s1.value)
    return effect(() => {
      log2.push(s2.value)
    })
  })

  is(log1, [1]), is(log2, [2])
  s1.value++
  await tick()
  is(log1, [1, 2]), is(log2, [2, 2])

  s1.value++
  await tick()
  is(log1, [1, 2, 3]), is(log2, [2, 2, 2])

  console.log('s2.value++')
  s2.value++
  await tick()
  is(log1, [1, 2, 3]), is(log2, [2, 2, 2, 3])
})

// error
t.todo('signal: error in mapper', async t => {
  // NOTE: actually mb useful to have blocking error in mapper
  let x = signal(1)
  let y = x.map(() => { throw Error('123') })
  t.ok(y.error)
})

t.todo('signal: error in subscription', async () => {
  let x = signal(1)
  x.subscribe(() => { throw new Error('x') })
})

t.todo('signal: error in init', async () => {
  signal(() => { throw Error(123) });
})

t.todo('signal: error in set', async () => {
  let x = signal(1)
  x(() => { throw Error(123) })
})

// effect
t('effect: single', async () => {
  // NOTE: we don't init from anything. Use strui/from
  let log = [], v1 = signal(1)
  effect(() => log.push(v1.value))
  is(log, [1])
  v1.value = 2
  await tick()
  is(log, [1, 2])
})

t('effect: teardown', async () => {
  const a = signal(0)
  const log = []
  let dispose = effect(() => {
    log.push('in', a.value)
    const val = a.value
    return () => log.push('out', val)
  })
  // is(log, [])
  // a.value = 0
  is(log, ['in', 0])
  a.value = 1
  await tick()
  is(log, ['in', 0, 'out', 0, 'in', 1])
  dispose()
  is(log, ['in', 0, 'out', 0, 'in', 1, 'out', 1])
})

t('effect: subscribe to new props', () => {
  let a = signal(0), b = signal(0)

  let i = 0
  effect(() => {
    i++
    if (a.value > 0) {
      b.value
    }
  })

  is(i, 1)
  b.value++
  is(i, 1)
  b.value++
  a.value++
  is(i, 2)
  b.value++
  is(i, 3)
})

t.skip('effect: subscribe to new props async', async () => {
  let a = signal(0), b = signal(0)

  let i = 0
  effect(async () => {
    i++
    await new Promise(ok => {
      queueMicrotask(() => {if (a.value > 0) b.value; ok()})
    })
  })

  is(i, 1)
  b.value++
  is(i, 1)
  b.value++
  a.value++
  await tick()
  is(i, 2)
  b.value++
  await tick()
  is(i, 3)
})

// computed
t('computed: single', () => {
  let v1 = signal(1), v2 = computed(() => v1.value)
  is(v2.value, 1)
  v1.value = 2
  is(v2.value, 2)
})

t('computed: multiple', () => {
  let v1 = signal(1), v2 = signal(1), v3 = computed(() => v1.value + v2.value)
  is(v3.value, 2)
  v1.value = 2
  is(v3.value, 3)
  v2.value = 2
  is(v3.value, 4)
})

t('computed: chain', () => {
  let a = signal(1),
    b = computed(() => (console.log('b'), a.value + 1)),
    c = computed(() => (console.log('c'), b.value + 1))

  is(c.value, 3)
  a.value = 2
  is(c.value, 4)
  a.value = 3
  is(c.value, 5)
})


// batch
t('batch: reversed change', () => {
  let s = signal(0), c = 0
  effect(() => (s.value,c++))

  batch(() => {s.value++})
  is(s.value, 1)
  is(c, 2, 'number of calls')

  batch(() => {s.value++;s.value--})
  is(s.value, 1)
  is(c, 3, 'number of calls')
})
