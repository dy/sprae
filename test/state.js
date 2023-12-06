import state, { effect as fx, batch } from '../src/state.signals-proxy.js'
import t, { is, ok, throws } from 'tst'
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
  is(s.w, [1, 2])

  // updating array is fine
  let mult; fx(() => (mult = s.w?.[0] * s.w?.[1] || 0))
  is(mult, 2)
  s.w = [3, 4]
  await tick()
  is(mult, 12)

  console.log('s.w = null')
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

t.skip('state: state from state', () => {
  // NOTE: we do clone, not returning reference
  let s = { x: 1 }
  let s1 = state(s)
  let s2 = state(s1)
  ok(s1 === s2)
})

t('state: inheritance', () => {
  let s = state({ x: 0 })
  //s.x;
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
  let s = state(s1, { y: 2 })
  // console.group('fx')
  let xy = 0; fx(() => (xy = s.x + s.y));
  // console.groupEnd('fx')
  await tick()
  is(xy, 3)
  console.log('x++')
  s.x++
  await tick()
  is(xy, 4)
  is(s1.x, 2)
  console.log('y++')
  s.y++
  await tick()
  is(xy, 5)
  // NOTE: this is identical behavior to `a={y:1}, b=Object.create(a), b.y++`
  is(s1.y, 3)
})

t('state: inheritance: lazy init', async () => {
  let s = state({ x: { foo: 'bar' } })
  console.log('------create s1')
  const x = s.x;
  let s1 = state(x, s)
  is(s1.foo, 'bar')
  let last
  fx(() => (last = s1.foo))
  is(last, 'bar')
  console.log('s.x.foo = `baz`')
  x.foo = 'baz'
  await tick()
  is(last, 'baz')
  is(s1.foo, 'baz')
  s1.foo = 'qux'
  is(x.foo, 'qux')
})

t('state: inheritance subscribes to parent getter', async () => {
  let s = state({ x: 1 })
  let s1 = state({}, s)
  let log = []
  fx(() => log.push(s1.z))
  is(log, [undefined])
  s1.z = 1
  fx(() => log.push(s1.z))
  s1.z = 2
  is(log, [undefined, 1, 2])
})

t('state: sandbox', async () => {
  let s = state({ x: 1 })
  is(s.window, window)
})

t('state: array items', async () => {
  // arrays get each item converted to signal struct
  let s5 = state({ list: [{ x: 1 }, { x: 2 }] })
  let sum; fx(() => (sum = s5.list.reduce((sum, item) => (item.x + sum), 0)))
  is(sum, 3)
  s5.list[0].x = 2
  await tick()
  is(sum, 4)
  console.log('set array value')
  s5.list = [{ x: 3 }, { x: 3 }]
  await tick()
  is(sum, 6)
  console.log('DO: list = [{x:3},{x:3},{x:4}]')
  s5.list = [{ x: 3 }, { x: 3 }, { x: 4 }]
  await tick()
  is(sum, 10)
})

t('state: object patch', async () => {
  let s = state({ o: { x: 1 } })
  is(s.o, { x: 1 })
  s.o = { y: 2 }
  is(s.o, { y: 2 })
})

t.todo('state: set element as prop', () => {
  const a = document.createElement('a')
  let s = state({ a })
  s.b = a
  is(s.a, a)
  is(s.b, a)
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
  let list = state([1, 2])
  let sum; fx(() => sum = list.reduce((sum, item) => item + sum, 0))
  is(sum, 3)
  list[0] = 2
  is(list[0], 2)
  await tick()
  is(sum, 4)
  console.log('splice')
  list.splice(0, 2, 3, 3)
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

t('state: array length', async () => {
  let a = state([1]), log = []
  fx(() => log.push(a.length))
  is(log, [1])
  a.push(1)
  await tick()
  is(log, [1, 2])
})

t.skip('state: changing length changes disposed items', async () => {
  // NOTE: we don't explicitly handle it here, since we force :each to read .length of the list, so it rerenders any time length changes.
  let a = state([1, 2, 3]), log = []
  fx(() => log.push(a.at(-1)))
  is(log, [3])
  a.splice(0)
  await tick()
  is(log, [1, 1])
})

t('state: from array state', async () => {
  let a = state([1])
  fx(() => a.push(a.push(1)))
})

t('state: detect circular?', async () => {
  let a = state([])
  // NOTE: the reason it didn't cycle in state.proxy was that it actually wasn't updating properly
  // since it must cycle here, a.push internally reads .length and self-subscribes effect
  fx(() => a.push(1))
  await tick()
  console.log(a)
  is(a.length, 1)
})

t('state: batch', async () => {
  let s = state({ x: 1, y: 2 })
  let log = []; fx(() => log.push(s.x + s.y))
  is(log, [3])
  batch(() => (s.x++, s.y++))
  await tick();
  is(log, [3, 5])
  batch(() => (
    batch(() => s.x++)
  ))
  await tick();
  is(log, [3, 5, 6])
})

t('state: inheritance does not change root', () => {
  const root = state({ x: 1, y: 2 })
  const s = state({ x: 2 }, root)
  is(root.x, 1)
})

t('state: bench', async () => {
  const N = 100000

  // signal-struct
  const { default: signals, effect: fx2 } = await import('../src/state.signals.js')
  let s2 = signals({ x: 1, y: 2 }), xy2
  fx2(() => xy2 = s2.x * s2.y)
  console.time('signals')
  for (let i = 0; i < N; i++) {
    s2.x++, s2.y++
    xy2 ** 2
  }
  console.timeEnd('signals')

  const { default: proxy, effect: fx3 } = await import('../src/state.proxy.js')
  let s3 = proxy({ x: 1, y: 2 }), xy3
  fx3(() => xy3 = s3.x * s3.y)
  console.time('proxy')
  for (let i = 0; i < N; i++) {
    s3.x++, s3.y++
    xy3 ** 2
  }
  console.timeEnd('proxy')

  const { default: sproxy, effect: fx1 } = await import('../src/state.signals-proxy.js')
  let s1 = sproxy({ x: 1, y: 2 }), xy
  fx1(() => xy = s1.x * s1.y)
  console.time('signals-proxy')
  for (let i = 0; i < N; i++) {
    s1.x++, s1.y++
    xy ** 2
  }
  console.timeEnd('signals-proxy')
})
