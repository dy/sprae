// import { signal } from 'usignal/sync'
import test, { is, any, throws } from 'tst'
import { tick, time } from 'wait-please'
import sprae, { signal } from '../src/index.js'
import h from 'hyperf'

test.skip('events: async', async e => {
  let el = h`<div :onx="e => {await v = 1; log.push(v);}"></div>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.Event('x'));
  is(state.log, [])
  await tick(1);
  is(state.log, [1])

  let el2 = h`<div :onx="e => {1; log.push(1);}"></div>`
  let state2 = sprae(el2, { log: [] })
  el2.dispatchEvent(new window.Event('x'));
  is(state2.log, [])
  await tick(1);
  is(state2.log, [1])
})

test('events: t̵h̵i̵s̵ ̵c̵o̵n̵t̵e̵x̵t̵ event target', e => {
  // NOTE: we disregard this context, since we can obtain it from event target
  let el = h`<div :onx="event => log.push(event.target)"></div>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.Event('x'));
  is(state.log, [el])
})

test('events: multiple events', e => {
  let el = h`<div :onscroll:onclick:onx="event=>log.push(event.type)"></div>`
  let state = sprae(el, { log: [] })

  el.dispatchEvent(new window.Event('click'));
  is(state.log, ['click'])
  el.dispatchEvent(new window.Event('scroll'));
  is(state.log, ['click', 'scroll'])
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['click', 'scroll', 'x'])
})

test('events: once', e => {
  let el = h`<x :onx.once="e => (x && log.push(x))" ></x>`
  let s = sprae(el, { log: [], x: 1 })
  el.dispatchEvent(new window.Event('x'));
  is(s.log, [1])
  el.dispatchEvent(new window.Event('x'));
  is(s.log, [1])
  // should not react on changes signals from outside
  console.log('--- x=2')
  s.x = 2
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(s.log, [1])
})

test('events: capture, stop, prevent', e => {
  let el = h`<x :onx.capture="e => log.push(1)"><y :onx="e => log.push(2)"></y></x>`
  let state = sprae(el, { log: [] })
  el.firstChild.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [1, 2])

  let el2 = h`<x :onx="e => log.push(1)"><y :onx.stop="e => log.push(2)"></y></x>`
  let state2 = sprae(el2, { log: [] })
  el2.firstChild.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state2.log, [2])
})

test('events: window, self', e => {
  let el = h`<x :onx.self="e => log.push(1)"><y :onx.window="e => log.push(2)"></y></x>`
  let state = sprae(el, { log: [] })
  el.firstChild.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [])
  el.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [1])
  window.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [1, 2])
})

test('events: keys', e => {
  let el = h`<x :onkeydown.enter="e => log.push(1)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: '' }));
  is(state.log, [])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: '' }));
  is(state.log, [1])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  is(state.log, [1, 1])
})

test('events: key combinations', e => {
  let el = h`<x :onkeydown.ctrl-enter="e => log.push(1)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: '' }));
  is(state.log, [])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: '' }));
  is(state.log, [])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  is(state.log, [1])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }));
  is(state.log, [1, 1])
  let el2 = h`<x :onkeydown.ctrl-alt-enter="e=>log.push(1)"></x>`
})

test('events: keys with prevent', e => {
  let el = h`<y :onkeydown="event => log.push(event.key)"><x :ref="x" :onkeydown.enter.stop></x></y>`
  let state = sprae(el, { log: [] })
  state.x.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  console.log('enter')
  state.x.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  is(state.log, ['x'])
})

test('events: debounce', async e => {
  let el = h`<x :onkeydown.debounce-1="event => log.push(event.key)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, [])
  await time(2)
  is(state.log, ['x'])
})

test('events: debounce 0', async e => {
  let el = h`<x :onkeydown.debounce-0="e => log.push(e.key)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, [])
  await time(2)
  is(state.log, ['x'])
})

test('events: throttle', async e => {
  let el = h`<x :onkeydown.throttle-10="event => log.push(event.key)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, ['x'])
  await time(5)
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, ['x'])
  await time(10)
  is(state.log, ['x', 'x'])
  await time(10)
  is(state.log, ['x', 'x'])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, ['x', 'x', 'x'])
})
