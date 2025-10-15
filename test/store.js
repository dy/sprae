// test store only (not sprae)

import store, { _change, _signals } from '../store.js'
import { use, effect, batch, signal } from '../core.js'
import t, { is, ok } from 'tst'
import { tick } from 'wait-please'


t('store: basic', async () => {
  let s = store({ x: 0, y: 1 })

  let xy; effect(() => (xy = s.x + s.y))
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

t('store: signal-struct basics', async () => {
  let s = store({
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
  effect(() => zilog.push(s.z.i))
  is(zilog, [3])

  let xy; effect(() => xy = s.x + s.y)
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

t('store: deep props', async () => {
  let s = store({
    z: { r: 2, i: 3 }
  })

  // subscribes to deep values too: only z.r and z.i update result
  let len; effect(() => (len = (s.z.r ** 2 + s.z.i ** 2) ** 0.5))
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

t('store: array', async () => {
  let s = store({
    w: [1, 2]
  })
  is(s.w, [1, 2])

  // updating array is fine
  let mult; effect(() => (mult = s.w?.[0] * s.w?.[1] || 0))
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

t('store: bulk-update', async () => {
  let s = store({
    x: 0,
    y: 1,
    z: { r: 2, i: 3 },
    v: function () { return 1 },
    w: [1, 2],
    get xy() { return this.x + this.y },
    set xy([x, y]) { return this.x = x, this.y = y }
  })

  let xy; effect(() => xy = s.x + s.y)
  let len; effect(() => (len = (s.z.r ** 2 + s.z.i ** 2) ** 0.5))

  // bulk-update is deep
  // let [signals, update] = s
  // update({ x: 1, y: 1, z: { r: 3, i: 4 } })
  Object.assign(s, { x: 1, y: 1, z: { r: 3, i: 4 } })
  await tick()
  is(xy, 2)
  is(len, 5, 'len after update')
})

t('store: array with objects', async () => {
  let s = store({
    list: [{ n: 'a' }, { n: 'b' }]
  })

  is(s, { list: [{ n: 'a' }, { n: 'b' }] })
})

t('store: type consistency', () => {
  let s = store({})

  // signals retain same type as init data
  is(s.constructor, Object)

  // re-initializing returns itself
  let s1 = store(s)
  is(s, s1)
})

t('store: iteration is safe', () => {
  // it is not enumerable
  let s2 = store([])
  let log = []
  for (let i of s2) log.push(i)
  is(log, [], 'doesn\'t iterate')
})

t.skip('store: store from same instance', () => {
  // NOTE: we may want to have multiple proxies for same target, don't we?
  let s = { x: 1 }
  let s1 = store(s)
  let s2 = store(s)
  ok(s1 === s2)
})

t('store: store from store', () => {
  let s = { x: 1 }
  let s1 = store(s)
  let s2 = store(s1)
  ok(s1 === s2)
})

t('store: inheritance', () => {
  // NOTE: we do manual inheritance in :scope
  let s = store({ x: 0 })
  //s.x;
  let s1 = store({ y: 2 }, Object.create(s))
  is(s1.x, 0)
  is(s1.y, 2)

  // descendants are detected as instances
  let s3 = Object.create(s1), s3s = store(s3)
  is(s3, s3s)

  // can subscribe to reactive sources too
  // let s4 = store({
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

t('store: inheritance: updating values in chain', async () => {
  // NOTE: this is identical behavior to `a={y:1}, b=Object.create(a), b.y++`
  // it's not very relevant for us since we don't use parent in sense of chain, it's more in sense of sandbox
  let s1 = store({ x: 1 })
  console.log('---- create s2')
  let s2 = store({}, s1)
  console.log('---- s2.y=2')
  s2.y = 2
  let xy = 0;
  is(s2.x, 1)
  is(s2.y, 2)
  is(s1.y, undefined, 'does not leak to parent')
  effect(() => (console.group('fx', s2.x, s2.y), xy = s2.x + s2.y, console.groupEnd('fx')));
  await tick()
  is(xy, 3)
  console.log('----x++')
  await tick()
  s2.x++
  is(s1.x, 2)
  is(s2.x, 2)
  is(s2.y, 2)
  is(xy, 4)
  console.log('----y++')
  s2.y++
  await tick()
  is(xy, 5)
  // is(parent.y, 3)
})

t('store: inheritance does not change root (write shadowing)', () => {
  const root = store({ x: 1, y: 2 })
  let s = store({ x: 2 }, root)

  console.log('--- shadowing')
  is(root.x, 1)
  s.x = 3
  is(root.x, 1)
  s.y = 3
  is(s.y, 3)
  is(root.y, 3)

  console.log('--- new vars')
  s.z = 4
  is(s.z, 4)
  is(root.z, undefined)
})

t('store: inheritance: lazy init', async () => {
  let s = store({ x: { foo: 'bar' } })
  console.log('------create s1')
  const x = s.x;
  let s1 = store(x, { ...s[_signals] })
  is(s1.foo, 'bar')
  let last
  effect(() => (last = s1.foo))
  is(last, 'bar')
  console.log('---s.x.foo = `baz`')
  x.foo = 'baz'
  await tick()
  is(last, 'baz')
  is(s1.foo, 'baz')
  s1.foo = 'qux'
  is(x.foo, 'qux')
})

t('store: inheritance subscribes to parent getter', async () => {
  let s = store({ x: 1 })
  let s1 = store({}, s)
  let log = []
  effect(() => log.push(s1.z))
  is(log, [undefined])
  s1.z = 1
  effect(() => log.push(s1.z))
  s1.z = 2
  is(log, [undefined, 1, 2])
})

t('store: sandbox', async () => {
  let s = store({ x: 1 })
  is(s.window, window)
  console.log('--- set s.x = 2')
  let set = new Function('s', 'with(s) { y=2 }')
  // s.y = 2
  set(s)
  is(window.y, undefined)
  is(s.y, 2)
})

t('store: array items', async () => {
  // arrays get each item converted to signal struct
  let s5 = store({ list: [{ x: 1 }, { x: 2 }] })
  let sum; effect(() => (sum = s5.list.reduce((sum, item) => (item.x + sum), 0), console.log('reduce', s5.list)))
  await tick()
  is(sum, 3)
  console.log('--- list[0].x = 2')
  s5.list[0].x = 2
  await tick()
  is(sum, 4)
  console.log('--- list = [a, b]')
  s5.list = [{ x: 3 }, { x: 3 }]
  await tick()
  is(sum, 6)
  console.log('--- list = [a, b, c]')
  s5.list = [{ x: 3 }, { x: 3 }, { x: 4 }]
  await tick()
  is(sum, 10)
})

t('store: object patch', async () => {
  let s = store({ o: { x: 1 } })
  is(s.o, { x: 1 })
  s.o = { y: 2 }
  is(s.o, { y: 2 })
})

t('store: set special object as prop', () => {
  const a = new Date
  let s = store({ a })
  s.b = a
  is(s.a, a)
  is(s.b, a)
})

t.skip('store: arrays retain reference', () => {
  // NOTE: not sure if we need it - in favor of simplicity say we don't
  // arrays: retain reference
  let list = [1, 2, 3]
  let s6 = store({ list })
  s6.list[1] = 4
  is(list, [1, 4, 3])
})

t('store: splice case 1', async () => {
  // works with arrays as well
  let list = store([1, 2])
  let sum;
  effect(() => (console.group('effect', list),sum = list.reduce((sum, item) => item + sum, 0),console.groupEnd()));
  is(sum, 3)
  console.log('---list[0] = 2')
  list[0] = 2
  is(list[0], 2)
  await tick()
  is(sum, 4)
  console.log('---splice(0,2,3,3)')
  list.splice(0, 2, 3, 3, 0)
  await tick()
  is(sum, 6)
})

t('store: splice case 2', async () => {
  // works with arrays as well
  let list = store([1, 2])
  let sum;
  effect(() => (console.group('effect', list),sum = list.reduce((sum, item) => item + sum, 0),console.groupEnd()));
  is(sum, 3)
  console.log('---list[0] = 2')
  list[0] = 2
  is(list[0], 2)
  await tick()
  is(sum, 4)
  console.log('---splice(0,2,3,3)')
  list.splice(0, 2, 3, 3)
  await tick()
  is(sum, 6)
})

t('store: array methods', () => {
  // somehow sprae was falling with something like this
  let a = store({ a: [1] })
  let b = a['a']['map'](x => x * 2)
  is(b, [2])
})

t('store: array length', async () => {
  let a = store([1]), log = []
  effect(() => log.push(a.length))
  is(log, [1])
  a.push(1)
  await tick()
  is(log, [1, 2])
})

t('store: array mutators keep subscribable length', async () => {
  let a = store([]), log = []

  console.log('---push 1')
  a.push(1)
  is(a.length, 1)
  is(a[_change], 1)

  console.log('---effect')
  // must return subscribable length
  effect(() => console.log('effect!')||log.push(a.length))
  is(log, [1])

  console.log('---push 2')
  a.push(2)
  is(log, [1, 2])
})

t.skip('store: changing length changes disposed items', async () => {
  // NOTE: we don't explicitly handle it here, since we force :each to read .length of the list, so it rerenders any time length changes.
  let a = store([1, 2, 3]), log = []
  effect(() => log.push(a.at(-1)))
  is(log, [3])
  a.splice(0)
  await tick()
  is(log, [1, 1])
})

t('store: from array store', async () => {
  let a = store([])
  effect(() => a.push(a.push(1)))
})

t('store: detect circular?', async () => {
  let a = store([])
  // NOTE: the reason it didn't cycle in store.proxy was that it actually wasn't updating properly
  // since it must cycle here, a.push internally reads .length and self-subscribes effect
  effect(() => a.push(1))
  await tick()
  console.log(a)
  is(a.length, 1)
})

t('store: batch', async () => {
  let s = store({ x: 1, y: 2 })
  let log = []; effect(() => log.push(s.x + s.y))
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

t('store: adding new props to object triggers effect', () => {
  const s = store({ x: 1, y: 2 }), log = []
  effect(() => (console.group('fx'), log.push({ ...s }), console.groupEnd()))
  is(log, [{ x: 1, y: 2 }])
  console.log('---s.z=3')
  s.z = 3
  is(log, [{ x: 1, y: 2 }, { x: 1, y: 2, z: 3 }])
})

t.skip('store: length is not triggered extra times', async () => {
  // NOTE: we can handle it via each, even batch (not critical)
  let s = store([1, 2])
  let log = []
  effect(() => (console.log('len fx', s.length), log.push(s.length)))
  console.log('---push')
  s.push(3, 4)
  await tick()
  is(log, [2, 4])
})

t('store: retain global objects as is', async () => {
  let s = store({ console, Math })
  ok(s.console.log === globalThis.console.log)
  ok(s.Math.max === Math.max)
})

t('store: reading length', async () => {
  let o = store({}), l = store([])
  o[_change], l[_change]
})

t('store: array concat', async () => {
  let rows = store([1, 2])
  is(rows, [1, 2])
  is(rows.concat([3, 4]), [1, 2, 3, 4])
})

t('store: array subscribes to filtered', async () => {
  let list = store([1, 2]), result
  effect(() => result = list.filter(x => x > 1).length)
  is(result, 1)
  list.push(3)
  is(result, 2)
})

t('store: untracked values', async () => {
  let s = store({ x: 1, _y: 0, _z: null }), log = []
  is(s._y, 0)
  is(s._z, null)
  effect(() => log.push(s.x, s._y))
  is(log, [1, 0])
  s.x++
  is(log, [1, 0, 2, 0])
  s._y++
  is(log, [1, 0, 2, 0])
  s._y = 0
})

t('store: untracked substates', async () => {
  let s = store({ x: 1, _y: [0] }), log = []
  effect(() => log.push(s.x, s._y[0]))
  is(log, [1, 0])
  s.x++
  is(log, [1, 0, 2, 0])
  s._y[0]++
  is(log, [1, 0, 2, 0])
  s._y[0] = 0
  is(log, [1, 0, 2, 0])
})

t('store: parent props are set to the parent', async () => {
  // FIXME: have to decide if subscopes are write-transparent for parent or just read-transparent
  let parent = store({ x: 1 }), child = store({y: 2}, parent)
  is(parent, {x: 1})
  is(child, {y: 2})
  child.x = 2
  is(parent, {x: 2})
  is(child, {y: 2})
})
