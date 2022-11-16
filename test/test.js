import v from 'value-ref'
import { signal } from '@preact/signals'
import test, {is, any, throws} from 'tst'
import {tick, time} from 'wait-please'
import sprae from 'sprae'
import h from 'hyperf'

Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let s = ''
    this.childNodes.forEach(n => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : ''
    })
    return s
  }
})

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

test('common: reactive', async () => {
  let el = h`<label :for="name" :text="name" ></label><input :id="name" :name="name" :type="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`
  let params = sprae(el, {name:'text', url:'//google.com'})
  is(el.outerHTML, `<label class="∴text ∴for" for="text">text</label><input class="∴id ∴name ∴type ∴disabled" id="text" name="text" type="text"><a class="∴href" href="//google.com"></a><img class="∴src" src="//google.com">`)
  params.name = 'email'
  is(el.outerHTML, `<label class="∴text ∴for" for="email">email</label><input class="∴id ∴name ∴type ∴disabled" id="email" name="email" type="email"><a class="∴href" href="//google.com"></a><img class="∴src" src="//google.com">`)
})

test('common: style', async () => {
  let el = h`<x :style="style"></x>`
  let params = sprae(el, {style: "top: 1px"})
  is(el.outerHTML, `<x class="∴style" style="top: 1px"></x>`)
  params.style = {top: '2px'}
  is(el.outerHTML, `<x class="∴style" style="top: 2px;"></x>`)
})

test('common: class', async () => {
  let el = h`<x :class="a"></x><y :class="[b, c]"></y><z :class="{b:true, c:d}"></z>`
  const c = signal('z')
  let params = sprae(el, {a:'x', b:'y', c, d:false});
  is(el.outerHTML, `<x class="x"></x><y class="y z"></y><z class="b"></z>`);
  params.d = true;
  is(el.outerHTML, `<x class="x"></x><y class="y z"></y><z class="b c"></z>`);
  c.value = 'w'
  is(el.outerHTML, `<x class="x"></x><y class="y w"></y><z class="b c"></z>`);
})

test('props: base', async () => {
  let el = h`<input :prop="{for:1, title:2, form:3, type:4, placeholder: 5}"/>`
  let params = sprae(el)
  is(el.outerHTML, `<input class="∴prop" for="1" title="2" form="3" type="4" placeholder="5">`)
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
  is(el.innerHTML, '<span class="∴else-if">b</span>')
  params.a = 3
  is(el.innerHTML, '<span class="∴else">c</span>')

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
  is(el.innerHTML, '<span class="∴text ∴else-if">2:2</span>')
  params.a = 3
  is(el.innerHTML, '<span class="∴text ∴else">3</span>')
  params.a = 4
  is(el.innerHTML, '<span class="∴text ∴else">4</span>')

  params.a = 1
  is(el.innerHTML, '<span class="∴text ∴if">1:1</span>')
  params.a = 4
  is(el.innerHTML, '<span class="∴text ∴else">4</span>')

  delete params.a
})

test('conditions: reactive values', async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else-if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`

  const a = signal(1)
  sprae(el, { a })

  is(el.innerHTML, '<span class="∴text ∴if">1:1</span>')
  a.value = 2
  is(el.innerHTML, '<span class="∴text ∴else-if">2:2</span>')
  a.value = 3
  is(el.innerHTML, '<span class="∴text ∴else">3</span>')
  a.value = 4
  is(el.innerHTML, '<span class="∴text ∴else">4</span>')

  a.value = 1
  is(el.innerHTML, '<span class="∴text ∴if">1:1</span>')
  a.value = 4
  is(el.innerHTML, '<span class="∴text ∴else">4</span>')
})


test('each: base', async () => {
  // FIXME: in some conspicuous reason jsdom fails to update text nodes somehow
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`

  const params = sprae(el, { b: [] })

  is(el.innerHTML, '')
  params.b = [1,2]
  is(el.innerHTML, '<span class="∴each ∴text">1</span><span class="∴each ∴text">2</span>')
  params.b = []
  is(el.innerHTML, '')
  delete params.b
  is(el.innerHTML, '')
})

test('each: reactive values', async () => {
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`

  const b = signal([])
  const params = sprae(el, { b })

  is(el.innerHTML, '')
  b.value = [1,2]
  is(el.innerHTML, '<span class="∴each ∴text">1</span><span class="∴each ∴text">2</span>')
  b.value = []
  is(el.innerHTML, '')
  delete params.b
  is(el.innerHTML, '')
})

test('each: loop with condition', async () => {
  let el = h`<p>
  <span :each="a in b" :text="a" :if="c"></span>
  </p>`

  const params = sprae(el, { b: [1,2], c:false })

  is(el.innerHTML, '')
  params.c = true
  is(el.innerHTML, '<span class="∴each ∴text ∴if">1</span><span class="∴each ∴text ∴if">2</span>')
  params.b = [1]
  is(el.innerHTML, '<span class="∴each ∴text ∴if">1</span>')
  delete params.b
  is(el.innerHTML, '')
})

test('each: loop within condition', async () => {
  let el = h`<p>
    <x :if="a==1"><y :each="i in a" :text="i"></y></x>
    <x :else-if="a==2"><y :each="i in a" :text="-i"></y></x>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<x class="∴if"><y class="∴each ∴text">1</y></x>')
  params.a = 2
  is(el.innerHTML, '<x class="∴else-if"><y class="∴each ∴text">-1</y><y class="∴each ∴text">-2</y></x>')
  params.a = 0
  is(el.innerHTML, '')
})

test('each: condition within loop', async () => {
  let el = h`<p>
    <x :each="a in b">
      <y :if="a==1" :text="'1:'+a"></y>
      <y :else-if="a==2" :text="'2:'+a"></y>
      <y :else :text="a"></y>
    </x>
  </p>`

  const params = sprae(el, { b: [1,2,3] })

  is(el.innerHTML, '<x class="∴each"><y class="∴text ∴if">1:1</y></x><x class="∴each"><y class="∴text ∴else-if">2:2</y></x><x class="∴each"><y class="∴text ∴else">3</y></x>')
  params.b = [2]
  is(el.innerHTML, '<x class="∴each"><y class="∴text ∴else-if">2:2</y></x>')
  delete params.b
  is(el.innerHTML, '')
})


test.todo('with: inline', () => {
  let el = h`<x :with="{foo:'bar', baz}"><y :text="foo + baz"></y></x>`
  let state = sprae(el, {baz: 'qux'})
  // FIXME: this doesn't inherit root scope baz property and instead uses hard-initialized one
  is(el.innerHTML, `<y>barqux</y>`)
  state.baz = 'quux'
  is(el.innerHTML, `<y>barquux</y>`)
})
test.todo('with: data', () => {
  let el = h`<x :with="x"><y :text="foo"></y></x>`
  let [state, update] = sprae(el, {x:{foo:'bar'}})
  is(el.innerHTML, `<y>bar</y>`)
  update({x:{foo:'baz'}})
  is(el.innerHTML, `<y>baz</y>`)
})
test.todo('with: inheritance', () => {
  // NOTE: y:text initializes through directive, not through parent
  // therefore by default :text uses parent's state, not defined by element itself
  let el = h`<x :with="{foo:'foo'}"><y :with="b" :text="foo+bar"></y></x>`
  sprae(el, {b:{bar:'bar'}})
  is(el.innerHTML, `<y>foobar</y>`)
})
test.todo('with: reactive inheritance', () => {
  let el = h`<x :with="{foo:1}"><y :with="b.c" :text="foo+bar"></y></x>`
  const bar = signal('2')
  sprae(el, {b:{c:{bar}}})
  is(el.innerHTML, `<y>12</y>`)
})