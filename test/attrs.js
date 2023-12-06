// import { signal } from 'usignal/sync'
import { signal, effect, untracked } from '@preact/signals-core'
import test, { is, any, throws } from 'tst'
import { tick, time } from 'wait-please'
import sprae from '../src/index.js'
import h from 'hyperf'
import createState, { } from '../src/state.signals-proxy.js'


test.skip('autoinit', async () => {
  is(window.x.innerHTML, '1')
})

test('hidden: core', async () => {
  let el = h`<div :hidden="hidden"></div>`
  sprae(el, { hidden: true })
  is(el.outerHTML, `<div hidden=""></div>`)
  sprae(el, { hidden: false })
  await tick()
  is(el.outerHTML, `<div></div>`)
})

test('hidden: reactive', async () => {
  const hidden = signal(true)
  let el = h`<div :hidden="hidden"></div>`
  sprae(el, { hidden })
  is(el.outerHTML, `<div hidden=""></div>`)
  hidden.value = false
  is(el.outerHTML, `<div></div>`)
})

test('common: reactive', async () => {
  let el = h`<label :for="name" :text="name" ></label><input :id="name" :name="name" :type="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`
  sprae(el, { name: 'text', url: '//google.com' })
  is(el.outerHTML, `<label for="text">text</label><input id="text" name="text" type="text"><a href="//google.com"></a><img src="//google.com">`)
  sprae(el, { name: 'email' })
  await tick()
  is(el.outerHTML, `<label for="email">email</label><input id="email" name="email" type="email"><a href="//google.com"></a><img src="//google.com">`)
})

test('common: empty strings', async () => {
  let el = h`<x :="" :x=""></x>`
  sprae(el)
  is(el.outerHTML, `<x></x>`)
})

test('common: comments', async () => {
  let el = h`<x :="/* */" :x="/* */"></x>`
  sprae(el)
  is(el.outerHTML, `<x></x>`)
})

test('common: newlines', async () => {
  let el = h`<x :text="
  x
  "></x>`
  sprae(el, { x: 1 })
  is(el.outerHTML, `<x>1</x>`)
})

test('common: const in on', async () => {
  let el = h`<div :onx="() => {const x=1; y=x+1}"></div>`
  let state = sprae(el, { y: 0 })
  el.dispatchEvent(new window.CustomEvent('x'))
  is(state.y, 2)
})

test('common: const in with', async () => {
  let el = h`<div :with="{x(){let x = 1; y=x;}}" @x="x()"></div>`
  let state = sprae(el, { y: 0 })
  el.dispatchEvent(new window.CustomEvent('x'))
  await tick()
  is(state.y, 1)
})

test('style', async () => {
  let el = h`<x style="left: 1px" :style="style"></x>`
  let params = sprae(el, { style: "top: 1px" })
  is(el.outerHTML, `<x style="left: 1px; top: 1px"></x>`)

  params.style = { top: '2px' }
  await tick()
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`)

  params.style = { '--x': 123 }
  await tick()
  is(el.style.getPropertyValue('--x'), '123')

  params.style = { top: '1px', bottom: '2px' }
  await tick()
  is(el.outerHTML, `<x style="left: 1px; top: 1px; bottom: 2px;"></x>`)

  params.style = { top: '2px', bottom: null }
  // FIXME
  await tick()
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`)
})

test('class', async () => {
  let el = h`<x class="base" :class="a"></x><y :class="[b, c]"></y><z :class="{b:true, c:d}"></z>`
  const c = signal('z')
  let params = sprae(el, { a: 'x', b: 'y', c, d: false });
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z class="b"></z>`);
  params.d = true;
  await tick()
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z class="b c"></z>`);
  // c.value = 'w'
  // is(el.outerHTML, `<x class="base x"></x><y class="y w"></y><z class="b c"></z>`);
})

test('class: undefined value', async () => {
  let el = h`<x :class="a"></x><y :class="[b]"></y><z :class="{c}"></z>`
  sprae(el, { a: undefined, b: undefined, c: undefined })
  is(el.outerHTML, `<x></x><y></y><z></z>`)
})

test('class: old svg fun', async () => {
  // raw html creates svganimatedstring
  let el = document.createElement('div')
  el.innerHTML = `<svg class="foo" :class="a ? 'x' : 'y'"></svg>`

  let s = sprae(el, { a: true })
  is(el.innerHTML, `<svg class="foo x"></svg>`)
  s.a = false
  await tick()
  is(el.innerHTML, `<svg class="foo y"></svg>`)
})

test('props: base', async () => {
  let el = h`<input :id="0" :="{for:1, title:2, help:3, type:4, placeholder: 5, value: 6, aB: 8}" :value="7"/>`
  let params = sprae(el)
  is(el.outerHTML, `<input id="0" for="1" title="2" help="3" type="4" placeholder="5" value="7" a-b="8">`)
})

test('props: sets prop', async () => {
  let el = h`<x :x="this.x=1" :y="this.y='abc'"></x>`
  sprae(el)
  is(el.x, 1)
  is(el.y, 'abc')
})

test('props: multiprop', async () => {
  let el = h`<input :id:name:for="0" />`
  let params = sprae(el)
  is(el.outerHTML, `<input id="0" name="0" for="0">`)
})

test('props: calculation', async () => {
  let el = h`<x :x="(()=>{ let a = 5; return Array.from({length: x}, (_,i)=>i).join('') })()"></x>`
  let state = sprae(el, { x: 3 });
  is(el.outerHTML, `<x x="012"></x>`)
  state.x = 4
  await tick()
  is(el.outerHTML, `<x x="0123"></x>`)
})

test.todo('props: semicols in expression', async () => {
  let el = h`<x :x="0; return Array.from({length: x}, (_,i)=>i).join('')"></x>`
  let state = sprae(el, { x: 3 });
  is(el.outerHTML, `<x x="012"></x>`)
  state.x = 4
  is(el.outerHTML, `<x x="0123"></x>`)
})


test.skip('data: base', async () => {
  let el = h`<input :data="{a:1, fooBar:2}"/>`
  let params = sprae(el)
  is(el.outerHTML, `<input data-a="1" data-foo-bar="2">`)
})

test.skip('aria: base', async () => {
  let el = h`<input type="text" id="jokes" role="combobox" :aria="{controls:'joketypes', autocomplete:'list', expanded:false, activeOption:'item1', activedescendant:'', xxx:null}"/>`
  sprae(el)
  is(el.outerHTML, `<input type="text" id="jokes" role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant="">`)
})

test('value: direct', async () => {
  let el = h`<input :value="a" />`
  let state = sprae(el, { a: 1 })
  is(el.value, '1')
  is(el.outerHTML, `<input value="1">`)
  state.a = 2
  await tick()
  is(el.value, '2')
  is(el.outerHTML, `<input value="2">`)

  el.value = 3
  // el.dispatchEvent(new window.Event('change'))
  // is(state.a, '3')
})

test('value: textarea', async () => {
  let el = h`<textarea :value="a"></textarea>`
  let state = sprae(el, { a: 'abcdefgh' })
  is(el.selectionStart, 8)
  is(el.selectionEnd, 8)
  el.setSelectionRange(1, 4)
  is(el.selectionStart, 1)
  is(el.selectionEnd, 4)
  state.a = 'xyzyvw'
  is(el.selectionStart, 1)
  is(el.selectionEnd, 4)
})

test('text: core', async () => {
  let el = h`<div :text="text"></div>`
  let params = sprae(el, { text: 'abc' })
  is(el.outerHTML, `<div>abc</div>`)
  params.text = null
  await tick()
  is(el.outerHTML, `<div></div>`)
})

test('if: base', async () => {
  let el = h`<p>
    <span :if="a==1">a</span>
    <span :else :if="a==2">b</span>
    <span :else >c</span>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<span>a</span>')
  params.a = 2
  await tick()
  is(el.innerHTML, '<span>b</span>')
  params.a = 3
  await tick()
  is(el.innerHTML, '<span>c</span>')
  params.a = null
  await tick()
  is(el.innerHTML, '<span>c</span>')
})

test('if: short with insertions', async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else :if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<span>1:1</span>')
  params.a = 2
  await tick()
  is(el.innerHTML, '<span>2:2</span>')
  params.a = 3
  await tick()
  is(el.innerHTML, '<span>3</span>')
  params.a = 4
  await tick()
  is(el.innerHTML, '<span>4</span>')

  params.a = 1
  await tick()
  is(el.innerHTML, '<span>1:1</span>')
  params.a = 4
  await tick()
  is(el.innerHTML, '<span>4</span>')

  params.a = null
})

test('if: reactive values', async () => {
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

test('if: (#3) subsequent content is not abandoned', async () => {
  let x = h`<x><y :if="!!y"></y><z :text="123"></z></x>`
  sprae(x, { y: false })
  is(x.outerHTML, `<x><z>123</z></x>`)
})

test('if: + :with doesnt prevent secondary effects from happening', async () => {
  let el = h`<div><x :if="x" :with="{}" :text="x"></x></div>`
  let state = sprae(el, { x: '' })
  is(el.innerHTML, ``)
  console.log('state.x=123')
  state.x = '123'
  await tick()
  is(el.innerHTML, `<x>123</x>`)

  // NOTE: we ignore this case
  // let el2 = h`<div><x :if="x" :with="{x:cond}" :text="x"></x></div>`
  // let state2 = sprae(el, {cond:''})
  // is(el2.innerHTML, ``)
  // state2.cond = '123'
  // is(el2.innerHTML, `<x>123</x>`)
})

test('each: array full', async () => {
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`

  const params = sprae(el, { b: [0] })

  is(el.innerHTML, '<span>0</span>')

  console.log('items[0]=1')
  params.b[0] = 1
  is(el.innerHTML, '<span>1</span>')

  console.log('items[1]=3')
  params.b[1] = 3
  await tick()
  is(el.innerHTML, `<span>1</span><span>3</span>`)

  console.log('items=[2,3]')
  params.b = [2, 3]
  await tick()
  is(el.innerHTML, '<span>2</span><span>3</span>')

  console.log('items[0]=1')
  params.b[0] = 1
  is(el.innerHTML, '<span>1</span><span>3</span>')

  console.log('items.shift()')
  params.b.shift()
  await tick()
  is(el.innerHTML, '<span>3</span>')

  console.log('items.length=2')
  params.b.length = 2
  await tick()
  is(el.innerHTML, '<span>3</span><span></span>')

  console.log('items.pop()')
  params.b.pop()
  await tick()
  is(el.innerHTML, '<span>3</span>')

  console.log('items=[]')
  params.b = []
  await tick()
  is(el.innerHTML, '')

  console.log('items=null')
  params.b = null
  await tick()
  is(el.innerHTML, '')
})


test('each: array length ops', async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`
  const params = sprae(el, { b: [0] })

  is(el.innerHTML, '<span>0</span>')
  params.b.length = 2
  is(el.innerHTML, '<span>0</span><span></span>')
  params.b.pop()
  is(el.innerHTML, '<span>0</span>')
})

test('each: array shift, pop', async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`
  const params = sprae(el, { b: [0, 1] })

  is(el.innerHTML, '<span>0</span><span>1</span>')

  console.log('items[0]=1')
  params.b.shift()
  is(el.innerHTML, '<span>1</span>')
  params.b.push(2)
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.b.pop()
  is(el.innerHTML, '<span>1</span>')
})

test('each: object', async () => {
  let el = h`<p>
    <span :each="x,key in b" :text="[key,x]"></span>
  </p>`

  const params = sprae(el, { b: null })

  is(el.innerHTML, '')
  console.log('set 1,2')
  params.b = { x: 1, y: 2 }
  await tick()
  is(el.innerHTML, '<span>x,1</span><span>y,2</span>')
  params.b = []
  await tick()
  is(el.innerHTML, '')
  params.b = null
  await tick()
  is(el.innerHTML, '')
})

test('each: loop within loop', async () => {
  let el = h`<p>
    <x :each="b in c"><y :each="a in b" :text="a"></y></x>
  </p>`

  const params = sprae(el, { c: [[1, 2], [3, 4]] })

  is(el.innerHTML, '<x><y>1</y><y>2</y></x><x><y>3</y><y>4</y></x>')
  params.c = [[5, 6], [3, 4]]
  await tick()
  is(el.innerHTML, '<x><y>5</y><y>6</y></x><x><y>3</y><y>4</y></x>')
  // params.c[1] = [7,8]
  params.c = [params.c[0], [7, 8]]
  await tick()
  is(el.innerHTML, '<x><y>5</y><y>6</y></x><x><y>7</y><y>8</y></x>')
  // is(el.innerHTML, '<span>1</span><span>2</span>')
  params.c = []
  await tick()
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
  b.value = [1, 2]
  is(el.innerHTML, '<span>1</span><span>2</span>')
  console.log('b.value=[]')
  b.value = []
  is(el.innerHTML, '')
  params.b = null
  is(el.innerHTML, '')
})

test('each: loop with condition', async () => {
  // NOTE: there doesn't seem to be much value in exactly that
  // also it creates confusion with :else directive
  // prohibitin that allows in-order directives init
  let el = h`<p>
  <span :each="a in b" :text="a" :if="c"></span>
  </p>`

  const params = sprae(el, { b: [1, 2], c: false })

  is(el.innerHTML, '')
  params.c = true
  await tick()
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.b = [1]
  await tick()
  is(el.innerHTML, '<span>1</span>')
  console.log('set null')
  params.b = null
  await tick()
  is(el.innerHTML, '')
})

test('each: condition with loop', async () => {
  let el = h`<p>
  <span :if="c" :each="a in b" :text="a"></span>
  <span :else :text="c"></span>
  </p>`

  const params = sprae(el, { b: [1, 2], c: false })

  is(el.innerHTML, '<span>false</span>')
  params.c = true
  await tick()
  is(el.innerHTML, '<span>1</span><span>2</span>')
  params.b = [1]
  await tick()
  is(el.innerHTML, '<span>1</span>')
  params.b = null
  await tick()
  is(el.innerHTML, '')
  console.log('c=false')
  params.c = false
  await tick()
  is(el.innerHTML, '<span>false</span>')
})

test('each: loop within condition', async () => {
  let el = h`<p>
    <x :if="a==1"><y :each="i in a" :text="i"></y></x>
    <x :else :if="a==2"><y :each="i in a" :text="-i"></y></x>
  </p>`

  const params = sprae(el, { a: 1 })

  is(el.innerHTML, '<x><y>0</y></x>')
  params.a = 2
  await tick()
  is(el.innerHTML, '<x><y>0</y><y>-1</y></x>')
  params.a = 0
  await tick()
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

  const params = sprae(el, { b: [1, 2, 3] })

  is(el.innerHTML, '<x><y>1:1</y></x><x><y>2:2</y></x><x><y>3</y></x>')
  params.b = [2]
  await tick()
  is(el.innerHTML, '<x><y>2:2</y></x>')
  params.b = null
  await tick()
  is(el.innerHTML, '')
})

test('each: next items have own "this", not single one', async () => {
  // FIXME: fragment init like let el = h`<x :each="x in 3"></x>`
  let el = h`<div><x :each="x in 3" :data-x="x" :x="log.push(x, this.dataset.x)"></x></div>`
  let log = []
  let state = sprae(el, { log })
  is(state.log, [0, '0', 1, '1', 2, '2'])
})

test('each: unkeyed', async () => {
  let el = h`<div><x :each="x in xs" :text="x"></x></div>`
  let state = sprae(el, { xs: [1, 2, 3] })
  is(el.children.length, 3)
  is(el.textContent, '123')
  // let first = el.firstChild
  state.xs = [1, 3, 2]
  await tick()
  // is(el.firstChild, first)
  is(el.textContent, '132')
  state.xs = [3, 3, 3]
  await tick()
  is(el.textContent, '333')
  // is(el.firstChild, first)
})

test.skip('each: keyed', async () => {
  // keyed
  let el = h`<div><x :each="x in xs" :text="x" :key="x"></x></div>`
  let state = sprae(el, { xs: [1, 2, 3] })
  is(el.children.length, 3)
  is(el.textContent, '123')
  let first = el.firstChild
  state.xs = [1, 3, 2]
  await tick()
  is(el.firstChild, first)
  is(el.textContent, '132')
  state.xs = [3, 3, 3]
  await tick()
  is(el.textContent, '3')
  // is(el.firstChild, first)
})

test('each: wrapped source', async () => {
  let el = h`<div><x :each="i in (x || 2)" :text="i"></x></div>`
  sprae(el, { x: 0 })
  is(el.innerHTML, `<x>0</x><x>1</x>`)
})

test('each: unmounted elements remove listeners', async () => {
  // let's hope they get removed without memory leaks :')
})

test('each: internal children get updated by state update, also: update by running again', async () => {
  let el = h`<><x :each="item, idx in items" :text="item" :key="idx"></x></>`
  let state = sprae(el, { items: [1, 2, 3] })
  is(el.textContent, '123')
  state.items = [2, 2, 3]
  await tick()
  is(el.textContent, '223')
  console.log('items = [0, 2, 3]')
  // state.items = [0, 2, 3]
  state = sprae(el, { items: [0, 2, 3] })
  await tick()
  is(el.textContent, '023')
  // NOTE: this doesn't update items, since they're new array
  console.log('state.items[0] = 1')
  console.log(state.items)
  state.items[0] = 1
  // state.items = [...state.items]
  await tick()
  is(el.textContent, '123')
})

test('each: :id and others must receive value from context', () => {
  let el = h`<div><x :id="idx" :each="item, idx in items"></x></div>`
  sprae(el, { items: [1, 2, 3] })
  is(el.innerHTML, `<x id="0"></x><x id="1"></x><x id="2"></x>`)
})

test.skip('each: key-based caching is in-sync with direct elements', () => {
  // FIXME: I wonder if that's that big of a deal
  let el = h`<ul><li :each="i in x" :key="i" :id="i"></li></ul>`
  let el2 = h`<ul><li :each="i in x" :id="i"></li></ul>`
  let state = sprae(el, { x: 2 })
  let state2 = sprae(el2, { x: 2 })
  is(el.outerHTML, el2.outerHTML)
  console.log('---inserts')
  el.firstChild.after(el.firstChild.cloneNode(true))
  el2.firstChild.after(el2.firstChild.cloneNode(true))
  console.log('state.x = 3')
  state.x = 3
  state2.x = 3
  is(el.outerHTML, el2.outerHTML)
})

test('each: remove last', () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.findIndex(x => x.id == item.id)
      this.rows.splice(index, 1)
    }
  })

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`)
  console.log('Remove id 5')
  s.remove({ id: 5 })
  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr></table>`)
})

test('each: remove first', () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.findIndex(x => x.id == item.id)
      this.rows.splice(index, 1)
    }
  })

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`)
  console.log('Remove id 1')
  s.remove({ id: 1 })
  is(el.outerHTML, `<table><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`)
})

test('each: swapping', () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>`;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]

  let s = sprae(el, {
    rows,
    swap() {
      const a = this.rows[1]
      console.log(`[1]=[4]`)
      this.rows[1] = this.rows[this.rows.length - 2]
      console.log(`[4]=[1]`)
      this.rows[this.rows.length - 2] = a
    }
  })

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`)
  s.swap()
  is(el.outerHTML, `<table><tr>1</tr><tr>4</tr><tr>3</tr><tr>2</tr><tr>5</tr></table>`)
})

test('each: with :with', () => {
  let el = h`<ul><li :each="i in 3" :with="{x:i}" :text="x"></li></ul>`
  sprae(el)
  is(el.outerHTML, `<ul><li>0</li><li>1</li><li>2</li></ul>`)
})

test('each: subscribe to modifying list', async () => {
  let el = h`<ul>
    <li :each="item in rows" :text="item" @remove="remove(item)">
    </li>
  </ul>`
  const state = sprae(el, { rows: [1], remove() { this.rows = [] } })
  is(el.outerHTML, `<ul><li>1</li></ul>`)
  // state.remove()
  el.querySelector('li').dispatchEvent(new window.Event('remove'))
  console.log('---removed', state.rows)

  await tick();
  is(el.outerHTML, `<ul></ul>`)
})

test('with: inline', async () => {
  let el = h`<x :with="{foo:'bar'}"><y :text="foo + baz"></y></x>`
  let state = sprae(el, { baz: 'qux' })
  is(el.innerHTML, `<y>barqux</y>`)
  state.baz = 'quux'
  await tick()
  is(el.innerHTML, `<y>barquux</y>`)
})
test('with: inline reactive', () => {
  let el = h`<x :with="{foo:'bar'}"><y :text="foo + baz"></y></x>`
  let baz = signal('qux')
  sprae(el, { baz })
  is(el.innerHTML, `<y>barqux</y>`)
  baz.value = 'quux'
  is(el.innerHTML, `<y>barquux</y>`)
})
test('with: data', async () => {
  let el = h`<x :with="x"><y :text="foo"></y></x>`
  let state = sprae(el, { x: { foo: 'bar' } })
  is(el.innerHTML, `<y>bar</y>`)
  console.log('update', state.x)
  state.x.foo = 'baz'
  await tick()
  // Object.assign(state, { x: { foo: 'baz' } })
  is(el.innerHTML, `<y>baz</y>`)
})
test('with: transparency', async () => {
  // NOTE: y:text initializes through directive, not through parent
  // therefore by default :text uses parent's state, not defined by element itself
  let el = h`<x :with="{foo:'foo'}"><y :with="b" :text="foo+bar"></y></x>`
  let params = sprae(el, { b: { bar: 'bar' } })
  is(el.innerHTML, `<y>foobar</y>`)
  params.b.bar = 'baz'
  await tick()
  is(el.innerHTML, `<y>foobaz</y>`)
})
test('with: reactive transparency', () => {
  let el = h`<x :with="{foo:1}"><y :with="b.c" :text="foo+bar"></y></x>`
  const bar = signal('2')
  sprae(el, { b: { c: { bar } } })
  is(el.innerHTML, `<y>12</y>`)
  bar.value = '3'
  is(el.innerHTML, `<y>13</y>`)
})
test('with: writes to state', async () => {
  let a = h`<x :with="{a:1}"><y :onx="e=>a++" :text="a"></y></x>`
  sprae(a)
  is(a.innerHTML, `<y>1</y>`)
  a.firstChild.dispatchEvent(new window.Event('x'))
  await tick()
  is(a.innerHTML, `<y>2</y>`)
  a.firstChild.dispatchEvent(new window.Event('x'))
  await tick()
  is(a.innerHTML, `<y>3</y>`)
})
test('with: one of children (internal number of iterations, cant see the result here)', async () => {
  let a = h`<div><x :text="x"></x><x :with={x:2} :text="x"></x><x :text="y">3</x></div>`
  sprae(a, { x: 1, y: 3 })
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`)
})

test(':render by ref', async () => {
  let a = h`<template :ref="abc"><div :text="123"></div></template><x :render="abc">456</x>`
  sprae(a)
  is(a.outerHTML, `<template><div :text="123"></div></template><x><div>123</div></x>`)
})

test(':render state', async () => {
  let a = h`<template :ref="abc"><div :text="text"></div></template><x :render="abc" />`
  let state = sprae(a, { text: 'abc' })
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`)
  state.text = 'def'
  await tick()
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>def</div></x>`)
})

test(':render :with', async () => {
  let a = h`<template :ref="tpl"><div :text="text"></div></template><x :render="tpl" :with="{text:'abc'}" />`
  let state = sprae(a)
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`)
})

test(':render nested items', async () => {
  let el = h`<template :ref="tpl"><div :each="item in items" :text="item.id"></div></template><x :render="tpl" :with="{items:[{id:'a'},{id:'b'}]}" />`
  let state = sprae(el)
  is(el.outerHTML, `<template><div :each="item in items" :text="item.id"></div></template><x><div>a</div><div>b</div></x>`)
})

test.todo(':render template after use', async () => {
  let a = h`<x :render="tpl" :with="{text:'abc'}" /><template :ref="tpl"><div :text="text"></div></template>`
  let state = sprae(a)
  is(a.outerHTML, `<x><div>abc</div></x><template><div :text="text"></div></template>`)
})

// FIXME: state.proxy gets into max callstack here
test('ref: base', async () => {
  let a = h`<a :ref="a" :init="log.push(a), null" :text="b"></a>`
  let state = sprae(a, { log: [], b: 1 })
  await tick()
  is(state.log[0], a)
  is(a.outerHTML, `<a>1</a>`)
  state.b = 2
  await tick()
  is(a.outerHTML, `<a>2</a>`)
  is(state.a, a, 'Exposes to the state');
})

test('ref: with :each', () => {
  let a = h`<y><x :ref="x" :each="item in items" :text="log.push(x), item"/></y>`
  let state = sprae(a, { log: [], items: [1, 2] })
  is(a.innerHTML, `<x>1</x><x>2</x>`)
  is(state.log, [...a.children])
})

test(':: reactive values', async () => {
  let a = signal();
  setTimeout(() => a.value = 2, 10)

  let el = h`<x :text="a">1</x>`
  sprae(el, { a })
  is(el.outerHTML, `<x></x>`)

  await time(20)
  is(el.outerHTML, `<x>2</x>`)
})

test(':: null result does nothing', async () => {
  let a = h`<x :="undefined"></x>`
  sprae(a)
  is(a.outerHTML, `<x></x>`)
})

test(':: scope refers to current element', async () => {
  let el = h`<x :text="log.push(this)"></x>`
  let state = sprae(el, { log: [] })
  is(state.log, [el])
})

test(':: scope directives must come first', async () => {
  // NOTE: we init attributes in order of definition
  let a = h`<x :text="y" :with="{y:1}" :ref="x"></x>`
  sprae(a, {})
  is(a.outerHTML, `<x>1</x>`)
})

test.todo('immediate scope', async () => {
  let el = h`<x :with="{arr:[], inc(){ arr.push(1) }}" :onx="e=>inc()" :text="arr[0]"></x>`
  sprae(el)
  is(el.outerHTML, `<x></x>`)
  el.dispatchEvent(new window.CustomEvent('x'))
  await tick()
  is(el.outerHTML, `<x>1</x>`)
})

test('getters', async () => {
  let x = h`<h2 :text="doubledCount >= 1 ? 1 : 0"></h2>`
  let state = sprae(x, {
    count: 0,
    get doubledCount() { return this.count * 2 }
  })
  is(x.outerHTML, `<h2>0</h2>`)
  state.count++
  await tick()
  is(x.outerHTML, `<h2>1</h2>`)
})

test('sandbox', async () => {
  // let el = h`<x :x="log.push(1)"></x>`
  let el = h`<x :x="log.push(typeof self, typeof console, typeof arguments, typeof __scope)"></x>`
  const s = sprae(el.cloneNode(), { log: [] })
  is(s.log, ['undefined', 'object', 'undefined', 'undefined'])

  s.log.splice(0)
  Object.assign(sprae.globals, { self: window })
  console.log('--------- sprae again')
  sprae(el.cloneNode(), { log: s.log })
  is(s.log, ['object', 'object', 'undefined', 'undefined'])
})

test('subscribe to array length', async () => {
  let el = h`<div :with="{likes:[]}"><x :onx="e=>(likes.push(1))"></x><y :text="likes.length"></y></div>`
  sprae(el)
  is(el.innerHTML, `<x></x><y>0</y>`)
  el.firstChild.dispatchEvent(new window.CustomEvent('x'))
  await tick()
  is(el.innerHTML, `<x></x><y>1</y>`)
})
