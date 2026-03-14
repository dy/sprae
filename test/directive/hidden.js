import { tick } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { is } from "tst";

test('hidden: basic', async () => {
  let el = h`<p :hidden="hide">text</p>`
  let state = sprae(el, { hide: true })
  is(el.hidden, true)

  state.hide = false
  await tick()
  is(el.hidden, false)
})

test('hidden: expression', async () => {
  let el = h`<p :hidden="count < 5" :text="count"></p>`
  let state = sprae(el, { count: 0 })
  is(el.hidden, true)

  state.count = 10
  await tick()
  is(el.hidden, false)
})

test('hidden: vs :if keeps element in DOM', async () => {
  let el = h`<div><span :hidden="hide">hidden</span><span :if="!hide">if</span></div>`
  let state = sprae(el, { hide: true })

  // :hidden keeps element in DOM, :if removes it
  is(el.querySelectorAll('span').length, 1) // only :hidden span remains
  is(el.querySelector('span').hidden, true)

  state.hide = false
  await tick()
  is(el.querySelectorAll('span').length, 2) // both visible now
  is(el.querySelector('span').hidden, false)
})

test('hidden: with :each', async () => {
  let el = h`<div><span :each="item in items" :hidden="item.hide" :text="item.name"></span></div>`
  let state = sprae(el, { items: [{ name: 'a', hide: false }, { name: 'b', hide: true }, { name: 'c', hide: false }] })
  await tick()
  let spans = el.querySelectorAll('span')
  is(spans[0].hidden, false)
  is(spans[1].hidden, true)
  is(spans[2].hidden, false)
})

test('hidden: reactive toggle', async () => {
  let el = h`<div><span :hidden="!visible">content</span></div>`
  let state = sprae(el, { visible: false })
  is(el.querySelector('span').hidden, true)

  state.visible = true
  await tick()
  is(el.querySelector('span').hidden, false)

  state.visible = false
  await tick()
  is(el.querySelector('span').hidden, true)
})

test('hidden: falsy values', async () => {
  let el = h`<p :hidden="v"></p>`
  let state = sprae(el, { v: 0 })
  is(el.hidden, false)

  state.v = 1
  await tick()
  is(el.hidden, true)

  state.v = null
  await tick()
  is(el.hidden, false)

  state.v = ''
  await tick()
  is(el.hidden, false)
})
