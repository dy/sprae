import state, { fx } from '../src/state.signals-proxy.js'
import t, { is, ok } from 'tst'
import signalStruct from 'signal-struct'
import { effect } from '@preact/signals-core'
import { tick } from 'wait-please'

t('state: basic', async t => {
  let s = state({ x: 0, y: 1 })

  let xy; fx(() => xy = s.x + s.y)
  is(xy, 1, 'Eq')
  console.log('set 2')
  s.x = 2
  console.log('set 3')
  s.y = 3
  await tick()
  is(xy, 5, 'Eq')
  s.y = 4
  await tick()
  is(xy, 6, 'Eq')
})

t('state: signal-struct basics', async t => {
  let s = state({
    x: 0,
    y: 1,
    z: { r: 2, i: 3 },
    v: function () { return 1 },
    w: [1, 2],
    get xy() { return this.x + this.y },
    set xy([x, y]) { return this.x = x, this.y = y }
  })

  // functions are signals too
  is(s.v(), 1)
  // subscribes to only x and y without need for .value access
  const zilog = []
  fx(() => zilog.push(s.z.i))
  is(zilog, [3])

  let xy; fx(() => xy = s.x + s.y)
  is(xy, 1)
  s.x = 2
  s.y = 3
  await tick()
  is(xy, 5)
  s.y = 4
  await tick()
  is(xy, 6)

  // getters are computed
  is(s.xy, 6)
  s.xy = [4, 2]
  is(s.x, 4)
  is(s.y, 2)
  is(s.xy, 6)
})

t('state: deep props', async () => {
  let s = state({
    z: { r: 2, i: 3 }
  })

  // subscribes to deep values too: only z.r and z.i update result
  let len; fx(() => (len = (s.z.r ** 2 + s.z.i ** 2) ** 0.5))
  s.z.r = 3
  s.z.i = 4
  await tick()
  is(len, 5)
  s.z.r = 4
  s.z.i = 3
  await tick()
  is(len, 5)

  // updating internal objects/arrays turns them into signals too
  s.z = { r: 5, i: 12 }
  await tick()
  is(len, 13)
})

t('state: array', async () => {
  let s = state({
    w: [1, 2]
  })

  // updating array is fine
  let mult; fx(() => mult = s.w?.[0] * s.w?.[1] || 0)
  is(mult, 2)
  s.w = [3, 4]
  await tick()
  is(mult, 12)

  // nullifying is fine
  s.w = null
  await tick()
  is(mult, 0)

  // delete is fine
  // delete s.w
  // await tick()
  // is(mult, 0)

  console.log('set w')
  s.w = [1, 2]
  await tick()
  is(mult, 2)
})

t('state: bulk-update', async () => {
  let s = state({
    x: 0,
    y: 1,
    z: { r: 2, i: 3 },
    v: function () { return 1 },
    w: [1, 2],
    get xy() { return this.x + this.y },
    set xy([x, y]) { return this.x = x, this.y = y }
  })

  // FIXME: number of invocations must be minimized
  let xy; fx(() => xy = s.x + s.y)
  let len; fx(() => (len = (s.z.r ** 2 + s.z.i ** 2) ** 0.5))

  // bulk-update is deep
  // let [signals, update] = s
  // update({ x: 1, y: 1, z: { r: 3, i: 4 } })
  Object.assign(s, { x: 1, y: 1, z: { r: 3, i: 4 } })
  await tick()
  is(xy, 2)
  is(len, 5, 'len after update')
})

t('state: type consistency', () => {
  let s = state({})

  // signals retain same type as init data
  is(s.constructor, Object)

  // re-initializing returns itself
  let s1 = state(s)
  is(s, s1)
})

t('state: iteration is safe', () => {
  // it is not enumerable
  let s2 = state([])
  let log = []
  for (let i of s2) log.push(i)
  is(log, [], 'doesn\'t iterate')
})

t.skip('state: state from same instance', () => {
  // NOTE: I guess we may wan to have multiple proxies for same target, don't we?
  let s = { x: 1 }
  let s1 = state(s)
  let s2 = state(s)
  ok(s1 === s2)
})

t('state: state from state', () => {
  let s = { x: 1 }
  let s1 = state(s)
  let s2 = state(s1)
  ok(s1 === s2)
})

t('state: inheritance', () => {
  let s = state({ x: 0 })
  let s1 = state({ y: 2 }, s)
  is(s1.x, 0)
  is(s1.y, 2)

  // descendants are detected as instances
  // let s3 = Object.create(s1), s3s = state(s3)
  // is(s3, s3s)

  // can subscribe to reactive sources too
  // let s4 = state({
  //   p: new Promise(ok => setTimeout(() => ok(123)))
  // })
  // is(s4.p, undefined)
  // setTimeout(() => {
  //   is(s4.p, 123)
  // })

  // let s43 = Object.create(s4, s3)
  // setTimeout(() => {
  //   is(s43.p,123)
  //   is(s43.y,1)
  // })
})

t('state: inheritance: updating values in chain', async () => {
  let s1 = { x: 1 }
  let s = state(s1, state({ y: 2 }))
  // console.group('fx')
  let xy = 0; fx(() => (xy = s.x + s.y));
  // console.groupEnd('fx')
  await tick()
  is(xy, 3)
  console.log('x++')
  s.x++
  await tick()
  is(xy, 4)
  console.log('y++')
  s.y++
  await tick()
  is(xy, 5)
})

t('state: array items', async () => {
  // arrays get each item converted to signal struct
  let s5 = state({ list: [{ x: 1 }, { x: 2 }] })
  let sum; fx(() => sum = s5.list.reduce((sum, item) => item.x + sum, 0))
  is(sum, 3)
  s5.list[0].x = 2
  await tick()
  is(sum, 4)
  console.log('set array value')
  s5.list = [{ x: 3 }, { x: 3 }]
  await tick()
  is(sum, 6)
  s5.list = [{ x: 3 }, { x: 3 }, { x: 4 }]
  await tick()
  is(sum, 10)
})

t.skip('state: arrays retain reference', () => {
  // NOTE: not sure if we need it
  // arrays retain reference
  let list = [1, 2, 3]
  let s6 = state({ list })
  s6.list[1] = 4
  is(list, [1, 4, 3])
})

t('state: direct list', async () => {
  // works with arrays as well
  let list = state([{ x: 1 }, { x: 2 }])
  let sum; fx(() => sum = list.reduce((sum, item) => item.x + sum, 0))
  is(sum, 3)
  list[0].x = 2
  is(list[0].x, 2)
  await tick()
  is(sum, 4)
  console.log('splice')
  list.splice(0, 2, { x: 3 }, { x: 3 })
  await tick()
  console.log(list)
  is(sum, 6)
})

t('state: array methods', () => {
  // FIXME: somehow sprae was falling with something like this
  let a = state({ a: [1] })
  let b = a['a']['map'](x => x * 2)
  is(b, [2])
})

t('state: circular?', () => {
  let a = state([])
  fx(() => a.push(1))
  a.push(2)
  is(a, [1, 2])
})

t.skip('state: batch', () => {
  let s = state({ x: 1, y: 2 })
  let log = []; fx(() => log.push(s.x + s.y))
  is(log, [3])
  batch(() => (s.x++, s.y++))
  is(log, [3, 5])
  batch(() => (
    batch(() => s.x++)
  ))
  is(log, [3, 5, 6])
})

t('state: bench', () => {
  const N = 100000

  let s2 = signalStruct({ x: 1, y: 2 }), xy2
  effect(() => xy2 = s2.x * s2.y)
  console.time('signalStruct')
  for (let i = 0; i < N; i++) {
    s2.x++, s2.y++
  }
  console.timeEnd('signalStruct')


  let s1 = state({ x: 1, y: 2 }), xy
  fx(() => xy = s1.x * s1.y)
  console.time('fxs')
  for (let i = 0; i < N; i++) {
    s1.x++, s1.y++
  }
  console.timeEnd('fxs')
})
