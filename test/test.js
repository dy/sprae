// import { signal } from 'usignal/sync'
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

test('style', async () => {
  let el = h`<x style="left: 1px" :style="style"></x>`
  let params = sprae(el, {style: "top: 1px"})
  is(el.outerHTML, `<x style="left: 1px; top: 1px"></x>`)
  params.style = {top: '2px'}
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`)

  params.style = {'--x': 123}
  is(el.style.getPropertyValue('--x'), '123')
})

test('class', async () => {
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

// FIXME: this must work without return
test.todo('props: calculation', async () => {
  let el = h`<x :x="let a = 5; return Array.from({length: x}, (_,i)=>i).join('')"></x>`
  let state = sprae(el, {x:3});
  is(el.outerHTML, `<x x="012"></x>`)
  state.x = 4
  is(el.outerHTML, `<x x="0123"></x>`)
})

test.todo('props: semicols in expression', async () => {
  let el = h`<x :x="0; return Array.from({length: x}, (_,i)=>i).join('')"></x>`
  let state = sprae(el, {x:3});
  is(el.outerHTML, `<x x="012"></x>`)
  state.x = 4
  is(el.outerHTML, `<x x="0123"></x>`)
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
  // el.dispatchEvent(new window.Event('change'))
  // is(state.a, '3')
})

test('value: textarea', async () => {
  let el = h`<textarea :value="a"></textarea>`
  let state = sprae(el, {a: 'abcdefgh'})
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
  let params = sprae(el, {text:'abc'})
  is(el.outerHTML, `<div>abc</div>`)
  params.text = null
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
  is(el.innerHTML, '<span>b</span>')
  params.a = 3
  is(el.innerHTML, '<span>c</span>')
  params.a = null
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
  sprae(x, {y: false})
  is(x.outerHTML, `<x><z>123</z></x>`)
})

test('if: + :with doesnt prevent secondary effects from happening', () => {
  let el = h`<div><x :if="x" :with="{}" :text="x"></x></div>`
  let state = sprae(el, {x:''})
  is(el.innerHTML, ``)
  state.x = '123'
  is(el.innerHTML, `<x>123</x>`)

  // NOTE: we ignore this case
  // let el2 = h`<div><x :if="x" :with="{x:cond}" :text="x"></x></div>`
  // let state2 = sprae(el, {cond:''})
  // is(el2.innerHTML, ``)
  // state2.cond = '123'
  // is(el2.innerHTML, `<x>123</x>`)
})

test('each: array', async () => {
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

test('each: object', async () => {
  // FIXME: in some conspicuous reason jsdom fails to update text nodes somehow
  let el = h`<p>
    <span :each="x,key in b" :text="[key,x]"></span>
  </p>`

  const params = sprae(el, { b: null })

  is(el.innerHTML, '')
  console.log('set 1,2')
  params.b = { x:1, y:2 }
  is(el.innerHTML, '<span>x,1</span><span>y,2</span>')
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
  params.c = [[5,6], [3,4]]
  is(el.innerHTML, '<x><y>5</y><y>6</y></x><x><y>3</y><y>4</y></x>')
  // params.c[1] = [7,8]
  params.c = [params.c[0], [7,8]]
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
  // NOTE: there doesn't seem to be much value in exactly that
  // also it creates confusion with :else directive
  // prohibitin that allows in-order directives init
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

test('each: next items have own "this", not single one', async () => {
  // FIXME: let el = h`<x :each="x in 3"></x>`
  let el = h`<div><x :each="x in 3" :data="{x}" :x="log.push(x, this.dataset.x)"></x></div>`
  let log = []
  let state = sprae(el, {log})
  is(state.log, [1,'1',2,'2',3,'3'])
})

test('each: unkeyed', async () => {
  let el = h`<div><x :each="x in xs" :text="x"></x></div>`
  let state = sprae(el, {xs:[1,2,3]})
  is(el.children.length, 3)
  is(el.textContent, '123')
  // let first = el.firstChild
  state.xs = [1,3,2]
  // is(el.firstChild, first)
  is(el.textContent, '132')
  state.xs = [3,3,3]
  is(el.textContent, '333')
  // is(el.firstChild, first)
})

test('each: keyed', async () => {
  // keyed
  let el = h`<div><x :each="x in xs" :text="x" :key="x"></x></div>`
  let state = sprae(el, {xs:[1,2,3]})
  is(el.children.length, 3)
  is(el.textContent, '123')
  let first = el.firstChild
  state.xs = [1,3,2]
  is(el.firstChild, first)
  is(el.textContent, '132')
  state.xs = [3,3,3]
  is(el.textContent, '3')
  // is(el.firstChild, first)
})

test.todo('each: unmounted elements remove listeners', async () => {
  // let's hope they get removed without memory leaks :')
})

test('each: internal children get updated by state update, also: update by running again', () => {
  let el = h`<><x :each="item, idx in items" :text="item" :key="idx"></x></>`
  let state = sprae(el, { items: [1,2,3] })
  is(el.textContent, '123')
  state.items = [2, 2, 3]
  is(el.textContent, '223')
  state = sprae(el, { items: [0,2,3] })
  is(el.textContent, '023')
  // NOTE: this doesn't update items, since they're new array
  console.log('set items')
  state.items[0] = 1
  state.items = [...state.items]
  is(el.textContent, '123')
})

test('each: :id and others must receive value from context', () => {
  let el = h`<div><x :id="idx" :each="item, idx in items"></x></div>`
  sprae(el, {items:[1,2,3]})
  is(el.innerHTML,`<x id="1"></x><x id="2"></x><x id="3"></x>`)
})

test('each: key-based caching is in-sync with direct elements', () => {
  let el = h`<ul><li :each="i in x" :key="i" :id="i"></li></ul>`
  let el2 = h`<ul><li :each="i in x" :id="i"></li></ul>`
  let state = sprae(el, {x:2})
  let state2 = sprae(el2, {x:2})
  is(el.outerHTML, el2.outerHTML)
  el.firstChild.after(el.firstChild.cloneNode(true))
  el2.firstChild.after(el2.firstChild.cloneNode(true))
  state.x = 3
  state2.x = 3
  is(el.outerHTML, el2.outerHTML)
})

test('on: base', () => {
  let el = h`<div :on="{click(e){log.push('click')}, x}"></div>`
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

test('onevt: this context', e => {
  let el = h`<div :onx="function(){log.push(this)}"></div>`
  let state = sprae(el, {log: []})
  el.dispatchEvent(new window.Event('x'));
  is(state.log, [el])
})

test('on: this in chains refers to el', () => {
  let el = h`<div :ona..onb="function(e){x=this; log.push(1); return () => log.push(2)}"></div>`
  let state = sprae(el, {log:[], x:null})
  el.dispatchEvent(new window.Event('a'));
  is(state.log, [1])
})

test('on: multiple events', e => {
  let el = h`<div :onscroll:onclick:onx="e=>log.push(e.type)"></div>`
  let state = sprae(el, {log:[]})

  el.dispatchEvent(new window.Event('click'));
  is(state.log, ['click'])
  el.dispatchEvent(new window.Event('scroll'));
  is(state.log, ['click','scroll'])
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['click','scroll','x'])
})

test('on: in-out events', e => {
  // let el = document.createElement('x');
  // el.setAttribute(':onmousedown..onmouseup', 'e=>(log.push(e.type),e=>log.push(e.type))')
  let el = h`<x :onmousedown..onmouseup="(e) => { x=this; log.push(e.type); return e=>log.push(e.type); }"></x>`

  let state = sprae(el, {log:[],x:null})
  el.dispatchEvent(new window.Event('mousedown'));
  is(state.x, el);
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown','mouseup'])
})

test('on: in-out side-effects', e => {
  let log = []

  // 1. skip in event and do directly out
  let el = h`<x :onin..onout="io"></x>`
  sprae(el, { io(e) {
    log.push(e.type)
    return (e) => (log.push(e.type), [1,2,3])
  } })

  el.dispatchEvent(new window.Event('out'));
  is(log, [])

  // 2. Some nonsensical return is fine
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in','out'], 'out triggers right')
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in','out'])
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in','out','in'])
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in','out','in'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in','out','in','out'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in','out','in','out'])
})

test('on: chain of events', e => {
  let el = h`<div :onmousedown..onmousemove..onmouseup="e=>(log.push(e.type),e=>(log.push(e.type),e=>log.push(e.type)))"></div>`
  let state = sprae(el, {log:[]})

  el.dispatchEvent(new window.Event('mousedown'));
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mousemove'));
  is(state.log, ['mousedown','mousemove'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown','mousemove','mouseup'])
})

test('on: state changes between chain of events', e => {
  let el = h`<x :on="{'x..y':fn}"></x>`
  let log = []
  let state = sprae(el, {log, fn: () => (log.push('x1'),()=>log.push('y1'))})
  console.log('emit x, x')
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1'])
  console.log('update fn')
  state.fn = () => (log.push('x2'), () => log.push('y2'))
  is(log, ['x1'])
  // console.log('xx')
  // NOTE: state update registers new chain listener before finishing prev chain
  // el.dispatchEvent(new window.Event('x'));
  // el.dispatchEvent(new window.Event('x'));
  // is(log, [1])
  console.log('emit y, y')
  el.dispatchEvent(new window.Event('y'));
  el.dispatchEvent(new window.Event('y'));
  is(log, ['x1'])
  console.log('emit x, x')
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1','x2'])
  console.log('emit y, y')
  el.dispatchEvent(new window.Event('y'));
  el.dispatchEvent(new window.Event('y'));
  is(log, ['x1','x2','y2'])
})

test('on: once', e => {
  // NOTE: if callback updates it's still rebound
  let el = h`<x :onx.once="(e=>x&&log.push(this))" ></x>`
  let log = []
  let state = sprae(el, {log, x:1})
  el.dispatchEvent(new window.Event('x'));
  is(log, [el])
  el.dispatchEvent(new window.Event('x'));
  is(log, [el])
  state.x = 2
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(log, [el])
})

test('on: capture, stop, prevent', e => {
  let el = h`<x :onx.capture="e=>log.push(1)"><y :onx="e=>log.push(2)"></y></x>`
  let state = sprae(el, {log:[]})
  el.firstChild.dispatchEvent(new window.Event('x', {bubbles:true}));
  is(state.log, [1,2])

  let el2 = h`<x :onx="e=>log.push(1)"><y :onx.stop="e=>log.push(2)"></y></x>`
  let state2 = sprae(el2, {log:[]})
  el2.firstChild.dispatchEvent(new window.Event('x', {bubbles:true}));
  is(state2.log, [2])
})

test('on: window, self', e => {
  let el = h`<x :onx.self="e=>log.push(1)"><y :onx.window="e=>log.push(2)"></y></x>`
  let state = sprae(el, {log:[]})
  el.firstChild.dispatchEvent(new window.Event('x', {bubbles:true}));
  is(state.log, [])
  el.dispatchEvent(new window.Event('x', {bubbles:true}));
  is(state.log, [1])
  window.dispatchEvent(new window.Event('x', {bubbles:true}));
  is(state.log, [1,2])
})

test('on: keys', e => {
  let el = h`<x :onkeydown.enter="e=>log.push(1)"></x>`
  let state = {log:[]}
  sprae(el, state)
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: '' }));
  is(state.log,[])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: '' }));
  is(state.log,[1])
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter' }));
  is(state.log,[1,1])
})

test('on: keys with prevent', e => {
  let el = h`<y :onkeydown="e=>log.push(e.key)"><x :ref="x" :onkeydown.enter.stop></x></y>`
  let state = sprae(el, {log:[]})
  state.x.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  console.log('enter')
  state.x.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  is(state.log,['x'])
})

test('on: debounce', async e => {
  let el = h`<x :onkeydown.debounce-1="e=>log.push(e.key)"></x>`
  let state = sprae(el, {log:[]})
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  is(state.log, [])
  await time(2)
  is(state.log, ['x'])
})

test('on: throttle', async e => {
  let el = h`<x :onkeydown.throttle-10="e=>log.push(e.key)"></x>`
  let state = sprae(el, {log:[]})
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

test('on: modifiers chain', async e => {
  let el = h`<x :onkeydown.letter..onkeyup.letter="e=>(log.push(e.key),(e)=>log.push(e.key))"></x>`
  let state = sprae(el, {log:[]})
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  is(state.log,['x'])
  el.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  is(state.log,['x'])
  el.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'x', bubbles: true }));
  is(state.log,['x', 'x'])
})

test('with: inline', () => {
  let el = h`<x :with="{foo:'bar'}"><y :text="foo + baz"></y></x>`
  let state = sprae(el, {baz: 'qux'})
  // FIXME: this doesn't inherit root scope baz property and instead uses hard-initialized one
  is(el.innerHTML, `<y>barqux</y>`)
  state.baz = 'quux'
  is(el.innerHTML, `<y>barquux</y>`)
})
test('with: inline reactive', () => {
  let el = h`<x :with="{foo:'bar'}"><y :text="foo + baz"></y></x>`
  let baz = signal('qux')
  sprae(el, {baz})
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
  state.x.foo = 'baz'
  // Object.assign(state, {x:{foo:'baz'}})
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

test('ref: base', () => {
  let a = h`<a :ref="a" :init="log.push(a), null" :text="b"></a>`
  let state = sprae(a, {log:[], b:1})
  is(state.log[0], a)
  is(a.outerHTML, `<a>1</a>`)
  state.b = 2
  is(a.outerHTML, `<a>2</a>`)
  is(state.a, a, 'Exposes to the state');
})

test('ref: with :each', () => {
  let a = h`<y><x :ref="x" :each="item in items" :text="log.push(x), item"/></y>`
  let state = sprae(a, {log: [], items: [1,2]})
  is(a.innerHTML, `<x>1</x><x>2</x>`)
  is(state.log, [...a.children])
})

test(':: reactive values', async () => {
  let a = new Promise((ok) => setTimeout(() => ok(2), 10))

  let el = h`<x :text="a">1</x>`
  sprae(el, {a})
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
  let state = sprae(el, {log:[]})
  is(state.log, [el])
})

test.todo(':: scope directives must come first', async () => {
  // NOTE: we init attributes in order of definition
  let a = h`<x :text="y" :with="{y:1}" :ref="x"></x>`
  sprae(a, {})
  is(a.outerHTML, `<x>1</x>`)
})

test.todo('getters', async () => {
  let x = h`<x>
    <h2 :if="doubledCount > 10">YAY!</h2>
    <button :text="count" :on="{click:increment}"/>
    <button :text="doubledCount" :on="{click:increment}"/>
  </x>`
  document.body.appendChild(x)
  let state = sprae(x, {
    count:0,
    get doubledCount(){ console.log(this); return this.count * 2},
    increment(){ this.count++ }
  })
})
