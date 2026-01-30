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
