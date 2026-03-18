import test, { any, is, ok, same } from "tst";
import { tick, time } from "wait-please";
import sprae, { start } from '../sprae.js'
import store from '../store.js'
import { signal, use } from '../core.js'
import h from "hyperf";

const isJessie = globalThis.process?.env?.SPRAE_COMPILER === 'jessie'
const isNode = !!globalThis.process?.versions?.node

test('core: version', () => {
  ok(sprae.version, '12.1.0')
})

test('core: pre-created store', async () => {
  let state = store({x:1,get(){return state.x}})
  let el = h`<x :text="get()"></x>`
  sprae(el, state)
  is(el.outerHTML, `<x>1</x>`)
  console.log('--- x=2')
  state.x=2
  await tick(2)
  is(el.outerHTML, `<x>2</x>`)
})

test("core: simple hidden attr", async () => {
  let el = h`<div :hidden="hidden"></div>`;
  let params = sprae(el, { hidden: true });
  is(el.outerHTML, `<div hidden=""></div>`);
  params.hidden = false;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("core: hidden reactive", async () => {
  const hidden = signal(true);
  let el = h`<div :hidden="hidden"></div>`;
  sprae(el, { hidden });
  is(el.outerHTML, `<div hidden=""></div>`);
  hidden.value = false;
  await tick()
  is(el.outerHTML, `<div></div>`);
});

test.skip('core: multiple elements', async () => {
  // NOTE: we don't support that anymore - no much value at price of complexity, just pass container
  let el = h`<a><x :text="'x'"></x><y :text="'y'"></y></a>`
  sprae(el.childNodes)
  is(el.innerHTML, `<x>x</x><y>y</y>`)
})

test("core: empty strings", async () => {
  let el = h`<x :="" :x=""></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("core: comments", async () => {
  let el = h`<x :="/* */" :x="/* */"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("core: inline comments", async () => {
  let el = h`<x :x="//"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("core: newlines", async () => {
  let el = h`<x :text="
  x
  "></x>`;
  sprae(el, { x: 1 });
  is(el.outerHTML, `<x>1</x>`);
});

test("core: const", async () => {
  let el = h`<div :onx="const x=1; y=x+1"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  is(state.y, 2);
});

test("core: let", async () => {
  let el = h`<div :fx="let x=1; y=x+1"></div>`;
  let state = sprae(el, { y: 0 });
  is(state.y, 2);
});

test("core: if", async () => {
  let el = h`<div :fx="if (x) log.push(1)"></div>`;
  let state = sprae(el, { x: 0, log: [] });
  is( state.log, []);
  state.x = 1;
  await tick();
  is(state.log, [1]);
});

test("core: bulk set", async () => {
  let el = h`<input :id="0" :="{for:1, title:2, help:3, type:4, placeholder: 5, value: 6, aB: 8}" :value="7"/>`;
  sprae(el);
  is(el.outerHTML, `<input id="0" for="1" title="2" help="3" type="4" placeholder="5" value="7" a-b="8">`);
});

test("core: sets el.prop", async () => {
  let el = h`<x :mount="e => el=e" :x="el.x=1" :y="el.y='abc'"></x>`;
  sprae(el, { el: null });
  is(el.x, 1);
  is(el.y, "abc");
});

test("core: multiprop", async () => {
  let el = h`<input :id:name:for="0" />`;
  sprae(el);
  is(el.outerHTML, `<input id="0" name="0" for="0">`);
});

test("core: calculation", async () => {
  // FIXME: fails for justin (cycle detected)
  let el = h`<x :x="a = 5, Array.from({length: x}, (_,i) => (i)).join('')"></x>`;
  let state = sprae(el, { x: 3, console, Array });
  is(el.outerHTML, `<x x="012"></x>`);
  state.x = 4;
  await tick();
  is(el.outerHTML, `<x x="0123"></x>`);
});

test("core: semicols in expression", async () => {
  let el = h`<x :x="log.push(0); log.push(Array.from({length: x}, (_,i)=>i).join(''));"></x>`;
  let state = sprae(el, { x: signal(3), Array, log: [] });
  is(el.outerHTML, `<x></x>`);
  await tick()
  is(state.log, [0, '012'])

  console.log('--- change x to 4')
  state.x = 4;
  await tick()
  is(state.log, [0, '012', 0, '0123'])
  // is(el.outerHTML, `<x x="0123"></x>`);
});

test("core: async value", async () => {
  let fetchData = async () => { await time(50); return 'data'; };
  let el = h`<div :fx="( x='', async () => ( x = await fetchData() ) )()" :text="x"></div>`;
  let state = sprae(el, { fetchData });
  is(el.textContent, '');
  await time(60);
  is(window.x, undefined);
  is(el.textContent, 'data');
});

test("core: async prop", async () => {
  let fetchData = async () => { await time(50); return 'data'; };
  let el = h`<div :text="await fetchData()"></div>`;
  let state = sprae(el, { fetchData  });
  is(el.textContent, '');
  await time(60);
  is(el.textContent, 'data');
});

test.skip("core: immediate scope", async () => {
  // not feasible
  let el = h`<x :scope="{arr:[], inc(){ arr.push(1) }}" :onx="e=>inc()" :text="arr[0]"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.outerHTML, `<x>1</x>`);
});

test("core: getters", async () => {
  let x = h`<h2 :text="doubledCount >= 1 ? 1 : 0"></h2>`;
  let state = sprae(x, {
    count: signal(0),
    get doubledCount() {
      return this.count * 2;
    },
  });
  is(x.outerHTML, `<h2>0</h2>`);
  state.count++;
  await tick();
  is(x.outerHTML, `<h2>1</h2>`);
});

test("core: subscribe to array length", async () => {
  // pre-heat can cause error
  sprae(h`<x :fx="(log.push(1))"></x>`, { log: [] });

  console.log('---create')
  let el = h`<div :scope="{likes:[]}"><x :onx="e=>(console.log('onx'),likes.push(1))"></x><y :text="console.log('text'),likes.length"></y></div>`;
  sprae(el, { console });
  is(el.innerHTML, `<x></x><y>0</y>`);

  console.log('---event')
  el.firstChild.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.innerHTML, `<x></x><y>1</y>`);
});

test.skip("csp: sandbox", async () => {
  const { default: justin } = await import('subscript/justin')
  sprae.use({ compile: justin })
  const globals = { console };
  const state = Object.assign(Object.create(globals), { log: [] });

  // let el = h`<x :x="log.push(1)"></x>`
  let el = h`<x :x="console.group('set'),log.push( self,  console,  arguments,  __scope),console.groupEnd()"></x>`;
  let s = sprae(el.cloneNode(), state);
  is(s.log, [undefined, console, undefined, undefined]);
  // s.log.splice(0);
  // s.log = [];
  Object.assign(globals, { self: window });
  console.log("--------- sprae again with globals");
  s = sprae(el.cloneNode(), state);
  // console.log(s.log)
  is(s.log, [window, console, undefined, undefined]);
});

test('globals', async () => {
  let el = h`<x :text="Math.PI.toFixed(2)"></x>`
  let state = sprae(el)
  is(el.outerHTML, `<x>3.14</x>`)
})


test("core: Math / other globals available in template", async () => {
  let el = h`<div :text="Math.max(2, 5, 1)"></div>`;
  sprae(el, { Math });
  is(el.innerHTML, '5');

  el = h`<div :text="Math.PI.toFixed(2)"></div>`;
  sprae(el, { Math });
  is(el.innerHTML, '3.14');

  el = h`<div :text="Math.sqrt(16)"></div>`;
  sprae(el, { Math });
  is(el.innerHTML, '4');
});

test("core: custom prefix", async () => {
  use({ prefix: 's-' })
  let el = h`<x s-text="a"></x>`;
  sprae(el, {a:123});
  is(el.outerHTML, `<x>123</x>`);
  use({prefix:':'})
})

test("core: data- prefix consumes data-* attributes", async () => {
  use({ prefix: 'data-' })
  let el = h`<img data-src="url" />`;
  sprae(el, { url: 'test.jpg' });
  is(el.getAttribute('src'), 'test.jpg');
  is(el.getAttribute('data-src'), null); // consumed by sprae
  use({ prefix: ':' })
})

test("core: data- prefix spread for ambiguous attrs", async () => {
  use({ prefix: 'data-' })
  let el = h`<img data-="{ src: url, alt: desc }" />`;
  sprae(el, { url: 'test.jpg', desc: 'photo' });
  is(el.getAttribute('src'), 'test.jpg');
  is(el.getAttribute('alt'), 'photo');
  use({ prefix: ':' })
})

test("core: class reserved word — use cls instead", async () => {
  let el = h`<div :class="cls"></div>`;
  let state = sprae(el, { cls: 'active' });
  is(el.className, 'active');
  state.cls = 'disabled';
  await tick();
  is(el.className, 'disabled');
})

test("core: style/value/hidden as variable names work", async () => {
  let el = h`<div :style="style" :hidden="hidden"></div>`;
  sprae(el, { style: 'color:red', hidden: true });
  is(el.getAttribute('style'), 'color:red');
  is(el.hidden, true);
})

test("core: getters work in inline scope", {skip: isJessie}, async () => {
  let el = h`<div :scope="{ count: 1, get double() { return this.count * 2 } }"><span :text="double"></span></div>`;
  sprae(el);
  is(el.querySelector('span').textContent, '2');
})

test("core: static errors don't break sprae", async () => {
  console.log('---again')
  let el = h`<y><x :text="0.toFixed(2)"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  is(el.innerHTML, `<x></x><x>b</x>`)
})

test("core: runtime errors don't break sprae", async () => {
  console.log('---again')
  let el = h`<y><x :text="a.b"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  is(el.innerHTML, `<x></x><x>b</x>`)
})

// jessie doesn't support `await` keyword
test("core: async errors don't break sprae", {skip:isJessie}, async () => {
  console.log('---async error')
  let el = h`<y><x :text="await Promise.reject('fail')"></x><x :text="b"></x></y>`
  let state = sprae(el, {b:'b'})
  await tick()
  await new Promise(r => setTimeout(r, 10)) // wait for async to settle
  is(el.innerHTML, `<x></x><x>b</x>`)
})

test("core: errors in one directive don't affect siblings", async () => {
  console.log('---sibling errors')
  let el = h`<y><x :text="a.b.c"></x><x :class="undefined.x"></x><x :text="ok"></x></y>`
  let state = sprae(el, {ok:'ok'})
  await tick()
  is(el.innerHTML, `<x></x><x></x><x>ok</x>`)
})

test("core: errors show element context", async () => {
  let errors = []
  let _error = console.error
  console.error = (...args) => errors.push(args.join(' '))

  let el = h`<x id="eid" :text="a.b"></x>`
  sprae(el, {})
  await tick()
  is(errors.length, 1)
  ok(errors[0].includes('<x#eid>'), 'static error shows element')
  ok(errors[0].includes('a.b'), 'static error shows expression')

  console.error = _error
})

test("core: runtime errors show element context", async () => {
  let errors = []
  let _error = console.error
  console.error = (...args) => errors.push(args.join(' '))

  let el = h`<x id="rt" :text="a.b.c"></x>`
  let state = sprae(el, { a: { b: { c: 'ok' } } })
  await tick()
  is(el.textContent, 'ok')
  is(errors.length, 0)

  state.a = {}
  await tick()
  is(errors.length, 1)
  ok(errors[0].includes('<x#rt>'), 'runtime error shows element')
  ok(errors[0].includes('a.b.c'), 'runtime error shows expression')

  console.error = _error
})

test("core: errors in :each don't break loop", async () => {
  console.log('---each errors')
  let el = h`<y><x :each="item in items" :text="item.name"></x></y>`
  let state = sprae(el, {items: [{name:'a'}, null, {name:'c'}]})
  await tick()
  is(el.innerHTML, `<x>a</x><x></x><x>c</x>`)
})

test.skip('core: memory allocation', async () => {
  let items = signal([])
  let el = h`<><x :each="item in items" :text="item.x"></x></>`
  let btn = document.createElement('button')
  document.body.appendChild(btn)
  btn.textContent = 'Allocate'
  btn.onclick = () => {
    let newItems = []
    for (let i = 0; i < 10000; i++) {
      let item = { x: i }
      newItems.push(item)
    }
    items.value = newItems
  }
  sprae(el, { items });
})

test('core: setTimeout illegal invokation', async () => {
  let el = h`<div :scope="c=0, x=()=>{ setTimeout(() => (c++)) }" :onx="x" :text="c"></div>`
  sprae(el)
  is(el.innerHTML, '0')
  el.dispatchEvent(new window.CustomEvent('x'))
  await time(0)
  is(el.innerHTML, '2')
})

test('core: autostart', async () => {
  let container = h`<div id="root" :scope="{pre:'pre', post:'post'}"><x :text="pre"></x></div>`;
  start(container);
  is(container.innerHTML, `<x>pre</x>`);
  let el = h`<y :text="post"></y>`
  container.appendChild(el);
  await time(10);
  is(container.innerHTML, `<x>pre</x><y>post</y>`);
})

test('core: autostart nested case', async () => {
  let container = h`<div :scope="{}"></div>`;
  start(container);
  await time()
  let a = h`<div><div :each="item in [{id:1}, {id:2}]"><x :text="item.id"></x></div></div>`
  container.appendChild(a)
  await time(10);
  is(container.innerHTML, `<div><div><x>1</x></div><div><x>2</x></div></div>`);
})

test('core: autostart nested case 2', async () => {
  // FIXME: find out why it calls each twice for mods
  let container = h`<div></div>`;
  let state = start(container, {log:[]});
  await time(10)
  let a = h`<y :each='item in [{ id: "1" },{ id: "2" }]'></y>`
  let x = h`<x :text="log.push(item?.id), item.id">dir</x>`
  container.appendChild(a)
  // NOTE: mutation observer here creates extra record, which inserts "template" element child, which is supposed to be ignored
  a.appendChild(x)
  await time(10);
  is(container.innerHTML, `<y><x>1</x></y><y><x>2</x></y>`);
  same(state.log.slice(-2), ['1','2'])
})

// jessie doesn't preserve `this` binding in compiled functions
test('core: list length unsub (preact signals)', {skip: isJessie}, async () => {
  // list.push disables list.length reading as reactive (cycle prevention)
  // but then preact signals unsubscribe :text from list.length updates
  let a = h`<x :scope="{list:[], add(item){ this.list.push('item') }}" ><y :text="list.length"></y><button :onx="add"></button></x>`
  let s = sprae(a)
  is(a.innerHTML, `<y>0</y><button></button>`)
  await time()

  console.log('---dispatch x')
  a.querySelector('button').dispatchEvent(new window.Event('x'))
  await time()
  is(a.innerHTML, `<y>1</y><button></button>`)

  console.log('---dispatch x')
  a.querySelector('button').dispatchEvent(new window.Event('x'))
  await time()
  is(a.innerHTML, `<y>2</y><button></button>`)
})

test('core: method this points to state', async () => {
  let el = h`<div :text="label()"></div>`
  let state = sprae(el, { x: 1, label() { return 'x=' + this.x } })
  is(el.outerHTML, `<div>x=1</div>`)
  state.x = 2
  await tick()
  is(el.outerHTML, `<div>x=2</div>`)
})

test('core: getter this points to state', async () => {
  let el = h`<div :text="doubled"></div>`
  let state = sprae(el, { count: 3, get doubled() { return this.count * 2 } })
  is(el.outerHTML, `<div>6</div>`)
  state.count = 5
  await tick()
  is(el.outerHTML, `<div>10</div>`)
})

test('core: method mutates state via this', async () => {
  let el = h`<x :text="x" :onclick="inc"></x>`
  let state = sprae(el, { x: 0, inc() { this.x++ } })
  is(el.outerHTML, `<x>0</x>`)
  el.click()
  await tick()
  is(el.outerHTML, `<x>1</x>`)
  el.click()
  await tick()
  is(el.outerHTML, `<x>2</x>`)
})

test('core: method with getter this', async () => {
  let el = h`<x :text="total()"></x>`
  let state = sprae(el, {
    price: 10, qty: 2,
    get subtotal() { return this.price * this.qty },
    total() { return '$' + this.subtotal }
  })
  is(el.outerHTML, `<x>$20</x>`)
  state.qty = 3
  await tick()
  is(el.outerHTML, `<x>$30</x>`)
})

// hasSemi: tests for semicolon detection in expressions (drives return vs no-return in compiler)
test("core: hasSemi — basic semicolons", () => {
  // semicolons cause statement mode (no return)
  let el = h`<x :fx="log.push(1); log.push(2)"></x>`;
  let state = sprae(el, { log: [] });
  is(state.log, [1, 2]);
});

test("core: hasSemi — semicolons inside strings are ignored", () => {
  let el = h`<x :text="';'"></x>`;
  sprae(el);
  is(el.textContent, ';');
});

test("core: hasSemi — semicolons inside template literals are ignored", { skip: isJessie }, () => {
  let el = h`<x :text="\`a;b\`"></x>`;
  sprae(el);
  is(el.textContent, 'a;b');
});

test("core: hasSemi — semicolons inside objects are ignored", () => {
  let el = h`<x :text="({a: 1}).a"></x>`;
  sprae(el);
  is(el.textContent, '1');
});

test('core: ownerDocument instead of global document (custom DOM)', {skip: !isNode}, async () => {
  let a = h`<y><template :each="item in [{id:1}, {id:2}, {id:3}]" :if="item.id % 2"><x :text="item.id"></x></template></y>`
  let b = h`<div><div id="target"></div><span :portal="'#target'">content</span></div>`
  let c = h`a<template :html="content"></template>`

  // Delete 'document' a brief time — works in both Node and browser
  ;(function (_document) {
    delete globalThis.document
    queueMicrotask(() => globalThis.document = _document) // defer re-add document to global even on exception
    sprae(a)
    sprae(b)
    sprae(c, { content: "<a>a</a>" })
  })(document)

  await tick()

  is(a.outerHTML, `<y><x>1</x><x>3</x></y>`)
  is(b.querySelector('#target').innerHTML, `<span>content</span>`)
  is(c.outerHTML, `a<a>a</a>`)
})

// Reproduces mandala finance page pattern: start(body) + :scope + :if + nested :each with async data
test('core: start() + :scope + :if + nested :each async', async () => {
  document.body.innerHTML = `
    <section :class="{'hidden': tab !== 'exp'}" :scope="{showFilter: false}">
      <div :if="view === 'list'">
        <div :each="yr in years">
          <div :each="g in yr.items">
            <button class="header" :text="g.key"></button>
            <div :each="x in g.items" class="item" :text="x.name"></div>
          </div>
        </div>
      </div>
    </section>
  `
  let s = start(document.body, { tab: 'exp', view: 'list', years: [] })
  is(document.querySelectorAll('.item').length, 0)

  // async data load
  s.years = [
    { key: '2026', items: [
      { key: 'March', items: [{ name: 'exp1' }, { name: 'exp2' }] },
      { key: 'Feb', items: [{ name: 'exp3' }] }
    ]}
  ]
  await tick(3)

  is(document.querySelectorAll('.header').length, 2, 'should have 2 month headers')
  is(document.querySelectorAll('.item').length, 3, 'should have 3 expense items')
  is(document.querySelectorAll('.item')[0].textContent, 'exp1')
  is(document.querySelectorAll('.item')[1].textContent, 'exp2')
  is(document.querySelectorAll('.item')[2].textContent, 'exp3')

  // cleanup — dispose sprae's mutation observer before clearing body
  sprae.dispose(document.body)
  document.body.innerHTML = ''
})

// Reproduces define-element + sprae: CE with internal sprae(this, state) in :each
// BUG: CE calls sprae(this, state) in connectedCallback. Parent :each also calls sprae(clone, subscope).
// The two sprae calls on the same element conflict — parent's sprae(clone) processes directives that
// the CE's internal sprae already processed (or vice versa).
test('core: CE with internal sprae in :each', async () => {
  let tag = 'de-internal-' + Math.random().toString(36).slice(2, 6)
  let propNames = new Set(['x'])
  class C extends HTMLElement {
    constructor() { super(); this._init = false; this._p = {} }
    connectedCallback() {
      if (this._init) return
      this._init = true

      // strip non-prop attrs before processor (like define-element does)
      let saved = [...this.attributes].filter(a => !propNames.has(a.name)).map(a => [a.name, a.value])
      for (let [n] of saved) this.removeAttribute(n)

      this.replaceChildren() // clear deep-clone children
      this.innerHTML = '<b :text="x?.name"></b>'
      this._state = sprae(this, { x: this._p.x })

      // restore parent attrs
      for (let [n, v] of saved) this.setAttribute(n, v)
    }
  }
  Object.defineProperty(C.prototype, 'x', {
    set(v) { this._p.x = v; if (this._init && this._state) this._state.x = v },
    get() { return this._p.x }
  })
  customElements.define(tag, C)

  document.body.innerHTML = `<section :scope="{f: false}"><${tag} :each="x in items" :x="x"></${tag}></section>`
  let s = start(document.body, { items: [{ name: 'A' }, { name: 'B' }] })
  await tick(8)

  let ces = document.querySelectorAll(tag)
  is(ces.length, 2, 'CE count')
  is(ces[0].querySelector('b')?.textContent, 'A', 'first')
  is(ces[1].querySelector('b')?.textContent, 'B', 'second')

  s.items = [{ name: 'X' }]
  await tick(8)
  ces = document.querySelectorAll(tag)
  is(ces.length, 1, 'shrunk')
  is(ces[0].querySelector('b')?.textContent, 'X', 'updated')

  sprae.dispose(document.body)
  document.body.innerHTML = ''
})

// Issue: cloneNode(true) copies stale children from initialized CE.
// When clone connects, connectedCallback appends template AGAIN → double content.
// define-element should clear stale children before mounting template.
// CE must clear stale children before populating (define-element pattern)
test('core: CE cloneNode deep-copies stale children', async () => {
  let tag = 'de-dupe-' + Math.random().toString(36).slice(2, 6)
  class C extends HTMLElement {
    constructor() { super(); this._init = false }
    connectedCallback() {
      if (this._init) return
      this._init = true
      // define-element fix: clear stale children from cloneNode(true)
      this.replaceChildren()
      let b = document.createElement('b')
      b.textContent = 'hello'
      this.appendChild(b)
    }
  }
  customElements.define(tag, C)

  document.body.innerHTML = `<${tag} :each="x in items"></${tag}>`
  let s = start(document.body, { items: ['a', 'b'] })
  await tick(4)

  let ces = document.querySelectorAll(tag)
  is(ces.length, 2, 'CE count')
  is(ces[0].querySelectorAll('b').length, 1, 'no duplicate children')

  sprae.dispose(document.body)
  document.body.innerHTML = ''
})

// CE must inject `host` ref for processor templates to dispatch events on the CE
test('core: CE template dispatchEvent targets host, not window', async () => {
  let tag = 'de-evt-' + Math.random().toString(36).slice(2, 6)
  class C extends HTMLElement {
    constructor() { super(); this._init = false }
    connectedCallback() {
      if (this._init) return
      this._init = true
      this.replaceChildren()
      // define-element fix: inject `host` ref into scope; use JSDOM-realm Event
      let E = this.ownerDocument.defaultView.Event
      this.innerHTML = '<button :onclick="e => emit(\'action\')">go</button>'
      sprae(this, { host: this, emit: (name) => this.dispatchEvent(new E(name, { bubbles: true })) })
    }
  }
  customElements.define(tag, C)

  let ceEvents = []
  document.body.innerHTML = `<${tag}></${tag}>`
  start(document.body, {})
  await tick(4)

  let ce = document.querySelector(tag)
  ce.addEventListener('action', () => ceEvents.push(1))

  ce.querySelector('button').click()
  await tick(2)

  is(ceEvents.length, 1, 'event should reach CE')

  sprae.dispose(document.body)
  document.body.innerHTML = ''
})

// Issue: CE parsed before customElements.define → HTMLUnknownElement.
// sprae :each uses cloneNode(true) → clone is also HTMLUnknownElement in real browsers.
// connectedCallback never fires on clones → empty elements.
// Fix: sprae should use createElement(tag) + copyAttrs for CEs instead of cloneNode.
test('core: :each with late-defined CE uses createElement', async () => {
  let tag = 'de-late-' + Math.random().toString(36).slice(2, 6)

  // 1. Put CE in DOM BEFORE defining class (simulates HTML parsing order)
  document.body.innerHTML = `<${tag} :each="x in items" :x="x"></${tag}>`

  // 2. Define class later (like sync <script> after the HTML usage)
  class C extends HTMLElement {
    constructor() { super(); this._init = false; this._p = {} }
    connectedCallback() {
      if (this._init) return
      this._init = true
      this.innerHTML = '<b></b>'
      this.querySelector('b').textContent = this._p.x?.name || ''
    }
  }
  Object.defineProperty(C.prototype, 'x', {
    set(v) { this._p.x = v; if (this._init) this.querySelector('b').textContent = v?.name || '' },
    get() { return this._p.x }
  })
  customElements.define(tag, C)

  // 3. sprae processes (like module script running after sync scripts)
  let s = start(document.body, { items: [{ name: 'A' }, { name: 'B' }] })
  await tick(4)

  let ces = document.querySelectorAll(tag)
  is(ces.length, 2, 'CE count')
  // Each clone must be a proper CE instance (connectedCallback fired)
  ok(ces[0]._init, 'first clone initialized')
  ok(ces[1]._init, 'second clone initialized')
  is(ces[0].querySelector('b')?.textContent, 'A', 'first content')
  is(ces[1].querySelector('b')?.textContent, 'B', 'second content')

  sprae.dispose(document.body)
  document.body.innerHTML = ''
})

// BUG: MutationObserver in start() processes nodes added inside a CE.
// When CE mounts its template, MO fires for the new children.
// root[_add] processes them with PAGE scope instead of CE scope.
// Fix: MO should skip nodes whose ancestor (between node and root) is a CE.
test('core: start() MO skips nodes added inside CE', async () => {
  let tag = 'de-mo-skip-' + Math.random().toString(36).slice(2, 6)
  let propMap = { items: true }
  class C extends HTMLElement {
    constructor() { super(); this._init = false; this._props = { items: [] } }
    connectedCallback() {
      if (this._init) return
      this._init = true

      // Strip non-prop attrs (parent directives) — define-element pattern
      let saved = [...this.attributes].filter(a => !(a.name in propMap)).map(a => [a.name, a.value])
      for (let [n] of saved) this.removeAttribute(n)

      // Mount template SYNCHRONOUSLY — matches real define-element behavior
      this.innerHTML = '<div :each="g in items" class="inner" :text="g.key"></div>'
      this.state = sprae(this, { items: this._props.items })

      // Restore parent attrs
      for (let [n, v] of saved) this.setAttribute(n, v)
    }
    set items(v) { this._props.items = v; if (this.state) this.state.items = v }
    get items() { return this._props.items }
  }
  customElements.define(tag, C)

  document.body.innerHTML = `<${tag} :items="data"></${tag}>`
  let s = start(document.body, { data: [{ key: 'A' }, { key: 'B' }] })
  await tick(4)

  let inners = document.querySelectorAll('.inner')
  is(inners.length, 2, 'CE should render 2 inner items')
  is(inners[0].textContent, 'A', 'first item')
  is(inners[1].textContent, 'B', 'second item')

  sprae.dispose(document.body)
  document.body.innerHTML = ''
})

// --- Real define-element integration (not simulated) ---
await import('define-element')
const DefineElement = customElements.get('define-element')

// Helper: define a CE via real define-element (async — connectedCallback defers via microtask)
async function defCE(tag, attrs, tplHTML) {
  let def = document.createElement('define-element')
  let proto = document.createElement(tag)
  if (attrs) for (let [k, v] of Object.entries(attrs)) proto.setAttribute(k, v)
  if (tplHTML) { let t = document.createElement('template'); t.innerHTML = tplHTML; proto.appendChild(t) }
  def.appendChild(proto)
  document.body.appendChild(def)
  await tick(2) // wait for deferred _init()
}

// Sprae processor for define-element: clone template, sprae, bridge prop changes
const spraeProcessor = (root, state) => {
  root.template && root.appendChild(root.template.content.cloneNode(true))
  let s = sprae(root, state)
  if (state.host) state.host.onpropchange = (name, val) => { if (name in s) s[name] = val }
  return s
}

test('core: define-element — basic rendering with sprae processor', async () => {
  let tag = 'de-real-' + Math.random().toString(36).slice(2, 6)
  DefineElement.processor = spraeProcessor
  await defCE(tag, { 'label:string': 'hello' }, '<b :text="label"></b>')

  let wrap = document.createElement('div')
  document.body.appendChild(wrap)
  let el = document.createElement(tag)
  el.setAttribute('label', 'world')
  wrap.appendChild(el)
  await tick(4)

  is(el.querySelector('b')?.textContent, 'world', 'renders prop value')

  el.label = 'updated'
  await tick(4)
  is(el.querySelector('b')?.textContent, 'updated', 'reactive update')

  wrap.remove()
  DefineElement.processor = null
})

test('core: define-element — :each with CE', async () => {
  let tag = 'de-each-' + Math.random().toString(36).slice(2, 6)
  DefineElement.processor = spraeProcessor
  await defCE(tag, { 'name:string': '' }, '<span :text="name"></span>')

  let wrap = document.createElement('div')
  document.body.appendChild(wrap)
  wrap.innerHTML = `<${tag} :each="item in items" :name="item.name"></${tag}>`
  let s = sprae(wrap, { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] })
  await tick(8)

  let ces = wrap.querySelectorAll(tag)
  is(ces.length, 3, 'creates 3 CEs')
  is(ces[0].querySelector('span')?.textContent, 'A', 'first')
  is(ces[1].querySelector('span')?.textContent, 'B', 'second')
  is(ces[2].querySelector('span')?.textContent, 'C', 'third')

  s.items = [{ name: 'X' }]
  await tick(8)
  ces = wrap.querySelectorAll(tag)
  is(ces.length, 1, 'shrunk to 1')
  is(ces[0].querySelector('span')?.textContent, 'X', 'updated value')

  sprae.dispose(wrap)
  wrap.remove()
  DefineElement.processor = null
})

test('core: define-element — host ref in scope', async () => {
  let tag = 'de-host-' + Math.random().toString(36).slice(2, 6)
  DefineElement.processor = spraeProcessor
  await defCE(tag, {}, '<b :text="host.tagName.toLowerCase()"></b>')

  let wrap = document.createElement('div')
  document.body.appendChild(wrap)
  let el = document.createElement(tag)
  wrap.appendChild(el)
  await tick(4)

  is(el.querySelector('b')?.textContent, tag, 'host ref points to CE')

  wrap.remove()
  DefineElement.processor = null
})
