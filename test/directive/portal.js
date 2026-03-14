import { tick } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { is } from "tst";

test('portal: move to selector', async () => {
  let el = h`<div><div id="target"></div><span :portal="'#target'">content</span></div>`
  sprae(el)
  is(el.querySelector('#target').innerHTML, `<span>content</span>`)
})

test('portal: dynamic toggle', async () => {
  let el = h`<div><div id="dest"></div><div :scope="{ show: false }"><span :portal="show && '#dest'">x</span><button :onclick="show = !show"></button></div></div>`
  sprae(el)
  is(el.querySelector('#dest').innerHTML, ``)
  is(el.querySelector('span').textContent, 'x')

  el.querySelector('button').click()
  await tick()
  is(el.querySelector('#dest').innerHTML, `<span>x</span>`)

  el.querySelector('button').click()
  await tick()
  is(el.querySelector('#dest').innerHTML, ``)
})

test('portal: to body element', async () => {
  let el = h`<span :portal="document.body">modal</span>`
  sprae(el)
  is(document.body.lastChild.textContent, 'modal')
  document.body.lastChild.remove()
})

test('portal: cleanup on dispose', async () => {
  let el = h`<div><div id="p-target"></div><span :portal="'#p-target'">content</span></div>`
  sprae(el)
  is(el.querySelector('#p-target').innerHTML, `<span>content</span>`)

  el[Symbol.dispose]()
  await tick()
  // after dispose, element should return to original position
  is(el.querySelector('#p-target').innerHTML, ``)
})

test('portal: conditional with :if', async () => {
  let el = h`<div><div id="p-dest2"></div><span :if="show" :portal="'#p-dest2'">hi</span></div>`
  let state = sprae(el, { show: false })
  is(el.querySelector('#p-dest2').innerHTML, ``)

  state.show = true
  await tick()
  is(el.querySelector('#p-dest2').innerHTML, `<span>hi</span>`)

  state.show = false
  await tick()
  is(el.querySelector('#p-dest2').innerHTML, ``)
})
