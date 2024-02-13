// import { signal } from 'usignal/sync'
import test, { is, any, throws } from 'tst'
import { tick, time } from 'wait-please'
import sprae, { signal } from '../src/index.js'
import h from 'hyperf'

test.skip('events: async', async e => {
  let el = h`<div @x="await v = 1; log.push(v);"></div>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.Event('x'));
  is(state.log, [])
  await tick(1);
  is(state.log, [1])

  let el2 = h`<div @x="1; log.push(1);"></div>`
  let state2 = sprae(el2, { log: [] })
  el2.dispatchEvent(new window.Event('x'));
  is(state2.log, [])
  await tick(1);
  is(state2.log, [1])
})

test('events: this context', e => {
  let el = h`<div @x="log.push(this)"></div>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.Event('x'));
  is(state.log, [el])
})

test('events: multiple events', e => {
  let el = h`<div @scroll@click@x="log.push(event.type)"></div>`
  let state = sprae(el, { log: [] })

  el.dispatchEvent(new window.Event('click'));
  is(state.log, ['click'])
  el.dispatchEvent(new window.Event('scroll'));
  is(state.log, ['click', 'scroll'])
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['click', 'scroll', 'x'])
})

test('events: once', e => {
  let el = h`<x @x.once="(x && log.push(this))" ></x>`
  let s = sprae(el, { log: [], x: 1 })
  el.dispatchEvent(new window.Event('x'));
  is(s.log, [el])
  el.dispatchEvent(new window.Event('x'));
  is(s.log, [el])
  // should not react on changes signals from outside
  console.log('--- x=2')
  s.x = 2
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(s.log, [el])
})

test('events: capture, stop, prevent', e => {
  let el = h`<x @x.capture="log.push(1)"><y @x="log.push(2)"></y></x>`
  let state = sprae(el, { log: [] })
  el.firstChild.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [1, 2])

  let el2 = h`<x @x="log.push(1)"><y @x.stop="log.push(2)"></y></x>`
  let state2 = sprae(el2, { log: [] })
  el2.firstChild.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state2.log, [2])
})

test('events: window, self', e => {
  let el = h`<x @x.self="log.push(1)"><y @x.window="log.push(2)"></y></x>`
  let state = sprae(el, { log: [] })
  el.firstChild.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [])
  el.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [1])
  window.dispatchEvent(new window.Event('x', { bubbles: true }));
  is(state.log, [1, 2])
})

test('events: keys', e => {
  let el = h`<x @keydown.enter="log.push(1)"></x>`
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
  let el = h`<x @keydown.ctrl-enter="log.push(1)"></x>`
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
  let el2 = h`<x @keydown.ctrl-alt-enter="log.push(1)"></x>`
})

test('events: keys with prevent', e => {
  let el = h`<y @keydown="log.push(event.key)"><x :ref="x" @keydown.enter.stop></x></y>`
  let state = sprae(el, { log: [] })
  state.x.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  console.log('enter')
  state.x.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  is(state.log, ['x'])
})

test('events: debounce', async e => {
  let el = h`<x @keydown.debounce-1="log.push(event.key)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, [])
  await time(2)
  is(state.log, ['x'])
})

test('events: debounce 0', async e => {
  let el = h`<x @keydown.debounce-0="log.push(event.key)"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, [])
  await time(2)
  is(state.log, ['x'])
})

test('events: throttle', async e => {
  let el = h`<x @keydown.throttle-10="log.push(event.key)"></x>`
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
