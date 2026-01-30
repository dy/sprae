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
