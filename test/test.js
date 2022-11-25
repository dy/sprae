// import { signal } from 'usignal'
import { signal } from '@preact/signals-core'
import test, {is, any, throws} from 'tst'
import {tick, time} from 'wait-please'
import sprae from '../src/index.js'
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

test.skip('autoinit', async () => {
  is(window.x.innerHTML, '1')
})

test('hidden: core', async () => {
  let el = h`<div :hidden="hidden"></div>`
  let params = sprae(el, {hidden:true})
  is(el.outerHTML, `<div hidden=""></div>`)
  params.hidden = false
  is(el.outerHTML, `<div></div>`)
})

test('hidden: reactive', async () => {
  const hidden = signal(true)
  let el = h`<div :hidden="hidden"></div>`
  sprae(el, {hidden})
  is(el.outerHTML, `<div hidden=""></div>`)
  hidden.value = false
  is(el.outerHTML, `<div></div>`)
})

test('common: reactive', async () => {
  let el = h`<label :for="name" :text="name" ></label><input :id="name" :name="name" :type="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`
  let params = sprae(el, {name:'text', url:'//google.com'})
  is(el.outerHTML, `<label for="text">text</label><input id="text" name="text" type="text"><a href="//google.com"></a><img src="//google.com">`)
  params.name = 'email'
  is(el.outerHTML, `<label for="email">email</label><input id="email" name="email" type="email"><a href="//google.com"></a><img src="//google.com">`)
})

test('common: style', async () => {
  let el = h`<x :style="style"></x>`
  let params = sprae(el, {style: "top: 1px"})
  is(el.outerHTML, `<x style="top: 1px"></x>`)
  params.style = {top: '2px'}
  is(el.outerHTML, `<x style="top: 2px"></x>`)
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
  let el = h`<input :prop="{for:1, title:2, help:3, type:4, placeholder: 5}"/>`
  let params = sprae(el)
  is(el.outerHTML, `<input for="1" title="2" help="3" type="4" placeholder="5">`)
})

test('data: base', async () => {
  let el = h`<input :data="{a:1, fooBar:2}"/>`
  let params = sprae(el)
  is(el.outerHTML, `<input data-a="1" data-foo-bar="2">`)
})

test('aria: base', async () => {
  let el = h`<input type="text" id="jokes" role="combobox" :aria="{controls:'joketypes', autocomplete:'list', expanded:false, activeOption:'item1', activedescendant:'', xxx:null}"/>`
  sprae(el)
  is(el.outerHTML, `<input type="text" id="jokes" role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant="">`)
})

test('value: direct', async () => {
  let el = h`<input :value="a" />`
  let state = sprae(el, {a:1})
  is(el.value, '1')
  is(el.outerHTML, `<input value="1">`)
  state.a = 2
  is(el.value, '2')
  is(el.outerHTML, `<input value="2">`)

  el.value = 3
  el.dispatchEvent(new window.Event('change'))
  is(state.a, '3')
})

test('text: core', async () => {
  let el = h`<div :text="text"></div>`
  let params = sprae(el, {text:'abc'})
  is(el.outerHTML, `<div>abc</div>`)
  params.text = null
  is(el.outerHTML, `<div></div>`)
})

test('conditions: base', async () => {
  let el = h`<p>
    <span :if="a==1">a</span>
    <span :else :if="a==2">b</span>
    <span :else >c</span>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<span>a</span>')
  params.a = 2
  is(el.innerHTML, '<span>b</span>')
  params.a = 3
  is(el.innerHTML, '<span>c</span>')
  params.a = null
  is(el.innerHTML, '<span>c</span>')
})

test('conditions: short with insertions', async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else :if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<span>1:1</span>')
  params.a = 2
  is(el.innerHTML, '<span>2:2</span>')
  params.a = 3
  is(el.innerHTML, '<span>3</span>')
  params.a = 4
  is(el.innerHTML, '<span>4</span>')

  params.a = 1
  is(el.innerHTML, '<span>1:1</span>')
  params.a = 4
  is(el.innerHTML, '<span>4</span>')

  params.a = null
})

test('conditions: reactive values', async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else :if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`

  const a = signal(1)
  sprae(el, { a })

  is(el.innerHTML, '<span>1:1</span>')
  a.value = 2
  is(el.innerHTML, '<span>2:2</span>')
  a.value = 3
  is(el.innerHTML, '<span>3</span>')
  a.value = 4
  is(el.innerHTML, '<span>4</span>')

  a.value = 1
  is(el.innerHTML, '<span>1:1</span>')
  a.value = 4
  is(el.innerHTML, '<span>4</span>')
})


test('each: base', async () => {
  // FIXME: in some conspicuous reason jsdom fails to update text nodes somehow
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`

  const params = sprae(el, { b: [] })

  is(el.innerHTML, '')
  console.log('set 1,2')
  params.b = [1,2]
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.b = []
  is(el.innerHTML, '')
  params.b = null
  is(el.innerHTML, '')
})

test('each: loop within loop', async () => {
  let el = h`<p>
    <x :each="b in c"><y :each="a in b" :text="a"></y></x>
  </p>`

  const params = sprae(el, { c: [[1,2], [3,4]] })

  is(el.innerHTML, '<x><y>1</y><y>2</y></x><x><y>3</y><y>4</y></x>')
  // console.log('set 1,2')
  // params.c = [[5,6], [3,4]]
  params.c[0][0] = 5, params.c[0][1] = 6
  is(el.innerHTML, '<x><y>5</y><y>6</y></x><x><y>3</y><y>4</y></x>')
  params.c[1] = [7,8]
  is(el.innerHTML, '<x><y>5</y><y>6</y></x><x><y>7</y><y>8</y></x>')
  // is(el.innerHTML, '<span>1</span><span>2</span>')
  params.c = []
  is(el.innerHTML, '')
  // params.b = null
  // is(el.innerHTML, '')
})

test('each: reactive values', async () => {
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`

  const b = signal([])
  const params = sprae(el, { b })

  is(el.innerHTML, '')
  b.value = [1,2]
  is(el.innerHTML, '<span>1</span><span>2</span>')
  b.value = []
  is(el.innerHTML, '')
  params.b = null
  is(el.innerHTML, '')
})

test('each: loop with condition', async () => {
  let el = h`<p>
  <span :each="a in b" :text="a" :if="c"></span>
  </p>`

  const params = sprae(el, { b: [1,2], c: false })

  is(el.innerHTML, '')
  params.c = true
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.b = [1]
  is(el.innerHTML, '<span>1</span>')
  params.b = null
  is(el.innerHTML, '')
})

test('each: condition with loop', async () => {
  let el = h`<p>
  <span :if="c" :each="a in b" :text="a"></span>
  <span :else :text="c"></span>
  </p>`

  const params = sprae(el, { b: [1,2], c: false })

  is(el.innerHTML, '<span>false</span>')
  params.c = true
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.b = [1]
  is(el.innerHTML, '<span>1</span>')
  params.b = null
  is(el.innerHTML, '')
  console.log('c=false')
  params.c = false
  is(el.innerHTML, '<span>false</span>')
})

test('each: loop within condition', async () => {
  let el = h`<p>
    <x :if="a==1"><y :each="i in a" :text="i"></y></x>
    <x :else :if="a==2"><y :each="i in a" :text="-i"></y></x>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<x><y>1</y></x>')
  params.a = 2
  is(el.innerHTML, '<x><y>-1</y><y>-2</y></x>')
  params.a = 0
  is(el.innerHTML, '')
})

test('each: condition within loop', async () => {
  let el = h`<p>
    <x :each="a in b">
      <y :if="a==1" :text="'1:'+a"></y>
      <y :else :if="a==2" :text="'2:'+a"></y>
      <y :else :text="a"></y>
    </x>
  </p>`

  const params = sprae(el, { b: [1,2,3] })

  is(el.innerHTML, '<x><y>1:1</y></x><x><y>2:2</y></x><x><y>3</y></x>')
  params.b = [2]
  is(el.innerHTML, '<x><y>2:2</y></x>')
  params.b = null
  is(el.innerHTML, '')
})

test('on: base', () => {
  let el = h`<div :on="{click(e){log.push('click')},x}"></div>`
  let log = signal([])
  let params = sprae(el, {x(){log.value.push('x')}, log})

  is(el.outerHTML, `<div></div>`);
  el.dispatchEvent(new window.Event('click'));
  is(log.value, ['click'])
  el.dispatchEvent(new window.Event('x'));
  is(log.value, ['click','x'])

  params.x = function(){log.value.push('xx')}
  el.dispatchEvent(new window.Event('x'));
  is(log.value, ['click','x','xx']);

  params.x = null;
  el.dispatchEvent(new window.Event('x'));
  is(log.value, ['click','x','xx']);
})

test('with: inline', () => {
  let el = h`<x :with="{foo:'bar', baz}"><y :text="foo + baz"></y></x>`
  let state = sprae(el, {baz: 'qux'})
  // FIXME: this doesn't inherit root scope baz property and instead uses hard-initialized one
  is(el.innerHTML, `<y>barqux</y>`)
  state.baz = 'quux'
  is(el.innerHTML, `<y>barquux</y>`)
})
test('with: inline reactive', () => {
  let el = h`<x :with="{foo:'bar', baz}"><y :text="foo + baz"></y></x>`
  let baz = signal('qux')
  let state = sprae(el, {baz})
  // FIXME: this doesn't inherit root scope baz property and instead uses hard-initialized one
  is(el.innerHTML, `<y>barqux</y>`)
  baz.value = 'quux'
  is(el.innerHTML, `<y>barquux</y>`)
})
test('with: data', () => {
  let el = h`<x :with="x"><y :text="foo"></y></x>`
  let state = sprae(el, {x:{foo:'bar'}})
  is(el.innerHTML, `<y>bar</y>`)
  console.log('update')
  Object.assign(state, {x:{foo:'baz'}})
  is(el.innerHTML, `<y>baz</y>`)
})
test('with: transparency', () => {
  // NOTE: y:text initializes through directive, not through parent
  // therefore by default :text uses parent's state, not defined by element itself
  let el = h`<x :with="{foo:'foo'}"><y :with="b" :text="foo+bar"></y></x>`
  let params = sprae(el, {b:{bar:'bar'}})
  is(el.innerHTML, `<y>foobar</y>`)
  params.b.bar = 'baz'
  is(el.innerHTML, `<y>foobaz</y>`)
})
test('with: reactive transparency', () => {
  let el = h`<x :with="{foo:1}"><y :with="b.c" :text="foo+bar"></y></x>`
  const bar = signal('2')
  sprae(el, {b:{c:{bar}}})
  is(el.innerHTML, `<y>12</y>`)
  bar.value = '3'
  is(el.innerHTML, `<y>13</y>`)
})
test('with: writes to state', () => {
  let a = h`<x :with="{a:1}"><y :on="{x(){a++}}" :text="a"></y></x>`
  sprae(a)
  is(a.innerHTML, `<y>1</y>`)
  a.firstChild.dispatchEvent(new window.Event('x'))
  is(a.innerHTML, `<y>2</y>`)
  a.firstChild.dispatchEvent(new window.Event('x'))
  is(a.innerHTML, `<y>3</y>`)
})