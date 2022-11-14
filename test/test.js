import v from 'value-ref'
import { signal } from '@preact/signals'
import test, {is, any, throws} from 'tst'
import {tick, time} from 'wait-please'
import sprae from 'sprae'
import h from 'hyperf'

test('hidden: core', async () => {
  let el = h`<div :hidden="hidden"></div>`
  let params = sprae(el, {hidden:true})
  is(el.outerHTML, `<div class="∴hidden" hidden=""></div>`)
  params.hidden = false
  is(el.outerHTML, `<div class="∴hidden"></div>`)
})

test('hidden: reactive', async () => {
  const hidden = signal(true)
  let el = h`<div :hidden="hidden"></div>`
  sprae(el, {hidden})
  is(el.outerHTML, `<div class="∴hidden" hidden=""></div>`)
  hidden.value = false
  is(el.outerHTML, `<div class="∴hidden"></div>`)
})

test('text: core', async () => {
  let el = h`<div :text="text"></div>`
  let params = sprae(el, {text:'abc'})
  is(el.outerHTML, `<div class="∴text">abc</div>`)
  params.text = null
  is(el.outerHTML, `<div class="∴text"></div>`)
})

test('conditions: base', async () => {
  let el = h`<p>
    <span :if="a==1">a</span>
    <span :else-if="a==2">b</span>
    <span :else >c</span>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<span class="∴if">a</span>')
  params.a = 2
  is(el.innerHTML, '<span>b</span>')
  params.a = 3
  is(el.innerHTML, '<span>c</span>')

  delete params.a
})

test('conditions: short with insertions', async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else-if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<span class="∴text ∴if">1:1</span>')
  params.a = 2
  is(el.innerHTML, '<span class="∴text">2:2</span>')
  params.a = 3
  is(el.innerHTML, '<span class="∴text">3</span>')
  params.a = 4
  is(el.innerHTML, '<span class="∴text">4</span>')

  params.a = 1
  is(el.innerHTML, '<span class="∴text ∴if">1:1</span>')
  params.a = 4
  is(el.innerHTML, '<span class="∴text">4</span>')

  delete params.a
})

test.todo('conditions: reactive values', async () => {

})


test.todo('loops: short', async () => {
  // FIXME: in some conspicuous reason jsdom fails to update text nodes somehow
  let el = h`<p>
    <span :each="item in items" :text="item"></span>
  </p>`

  const params = sprae(el, { items: [] })

  is(el.innerHTML, '')
  params.items = [1,2]
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.items = []
  is(el.innerHTML, '')

  delete params.items
})

test.todo('loops: reactive values', async () => {
})

test.todo('loops: condition within loop')

test.todo('loops: loop within condition')
