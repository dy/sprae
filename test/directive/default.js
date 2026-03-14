import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked, _state } from '../../core.js'


test("default: basic", async () => {
  let el = h`<label :for="name" :text="name" ></label><input type='text' :type="t => (log.push(t),name)" :id="name" :name="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`;
  let params = sprae(el, { name: 'text', url: "//google.com", log:[] });
  is(
    el.outerHTML,
    `<label for="text">text</label><input type="text" id="text" name="text"><a href="//google.com"></a><img src="//google.com">`,
  );
  is(params.log, ['text'])
  params.name = "email";
  await tick();
  is(
    el.outerHTML,
    `<label for="email">email</label><input type="email" id="email" name="email"><a href="//google.com"></a><img src="//google.com">`,
  );
});

test("default: signal", async () => {
  let a = signal();
  setTimeout(() => (a.value = 2), 10);

  let el = h`<x :text="a">1</x>`;
  sprae(el, { a });
  is(el.outerHTML, `<x></x>`);

  await time(20);
  is(el.outerHTML, `<x>2</x>`);
});

test("default: .parent target", async () => {
  let el = h`<div><x :title.parent="t"></x></div>`;
  let params = sprae(el, { t: 'hello' });
  is(el.getAttribute('title'), 'hello');
  is(el.firstChild.getAttribute('title'), null);
});

test("default: null result does nothing", async () => {
  let a = h`<x :="undefined"></x>`;
  sprae(a);
  is(a.outerHTML, `<x></x>`);
});

// web components: props should be set as element properties, not serialized to attributes
test("default: web component prop (object)", async () => {
  class XItems extends HTMLElement { constructor() { super() } }
  customElements.define('x-items', XItems);

  let items = [1, 2, 3];
  let el = h`<x-items :items="items"></x-items>`;
  sprae(el, { items });

  // object/array values should be set as properties on custom elements
  is(el.items, items);
  // should not serialize to attribute
  is(el.getAttribute('items'), null);
});

test("default: web component prop (primitive)", async () => {
  class XLabel extends HTMLElement { constructor() { super() } }
  customElements.define('x-label', XLabel);

  let el = h`<x-label :title="t"></x-label>`;
  sprae(el, { t: 'hello' });

  // primitives set as attributes on custom elements
  is(el.getAttribute('title'), 'hello');
});

test("default: web component prop (reactive update)", async () => {
  class XData extends HTMLElement { constructor() { super() } }
  customElements.define('x-data', XData);

  let el = h`<x-data :config="cfg"></x-data>`;
  let state = sprae(el, { cfg: { a: 1 } });
  is(el.config, { a: 1 });

  state.cfg = { a: 2 };
  await tick();
  is(el.config, { a: 2 });
});

test("default: spread on web component", async () => {
  class XSpread extends HTMLElement { constructor() { super() } }
  customElements.define('x-spread', XSpread);

  let el = h`<x-spread :="{ items, label }" ></x-spread>`;
  let items = [1, 2, 3];
  sprae(el, { items, label: 'test' });

  // all types set as properties on custom elements
  is(el.items, items);
  is(el.label, 'test');
});

// web component with :props — single-object trigger for isolated sprae
test("default: web component :props pattern", async () => {
  class XRow extends HTMLElement {
    constructor() { super() }
    set props(v) {
      if (!this.children.length)
        this.innerHTML = `<span :text="label"></span><em :text="count"></em>`,
        this.state = sprae(this, v)
      else Object.assign(this.state, v)
    }
  }
  customElements.define('x-row', XRow);

  let el = h`<div><x-row :props="{ label, count }"></x-row></div>`;
  let state = sprae(el, { label: 'hello', count: 42 });

  is(el.innerHTML, `<x-row><span>hello</span><em>42</em></x-row>`);

  // reactive update
  state.label = 'world';
  await tick();
  is(el.innerHTML, `<x-row><span>world</span><em>42</em></x-row>`);
});

// sprae skips descent into custom elements — component owns its children
test("default: web component isolation (no descent)", async () => {
  class XCard extends HTMLElement { constructor() { super() } }
  customElements.define('x-card', XCard);

  let el = h`<div><x-card :title="t"><span :text="title"></span></x-card></div>`;
  sprae(el, { t: 'parent-title', title: 'from-parent' });

  // parent sets :title as property on custom element, but does NOT descend
  is(el.querySelector('x-card').title, 'parent-title');
  // child span is untouched — :text directive was not processed
  is(el.querySelector('span').textContent, '', 'parent does not sprae component children');
});

// web component with individual props via observedAttributes
test("default: web component individual props (property setters)", async () => {
  customElements.define('x-card2', class extends HTMLElement {
    constructor() { super() }
    set name(v) {
      this._name = v
      if (this.state) { this.state.name = v; return }
      if (this._q) return
      this._q = true
      queueMicrotask(() => {
        this._q = false
        this.innerHTML = `<span :text="name"></span><img :src="avatar" />`
        this.state = sprae(this, { name: this._name, avatar: this._avatar })
      })
    }
    set avatar(v) {
      this._avatar = v
      if (this.state) this.state.avatar = v
    }
  });

  let el = h`<div><x-card2 :name="n" :avatar="a"></x-card2></div>`;
  let state = sprae(el, { n: 'Ada', a: 'ada.png' });
  await tick();

  is(el.querySelector('span').textContent, 'Ada');
  is(el.querySelector('img').getAttribute('src'), 'ada.png');

  // reactive update
  state.n = 'Bob';
  await tick();
  is(el.querySelector('span').textContent, 'Bob');
});

// --- Custom element property setting for all types ---

test("default: web component prop (function)", async () => {
  class XFn extends HTMLElement { constructor() { super() } }
  customElements.define('x-fn', XFn);

  let fn = () => 42;
  let el = h`<x-fn :handler="fn"></x-fn>`;
  sprae(el, { fn });

  // functions should be set as properties on custom elements, not stringified to attributes
  is(typeof el.handler, 'function');
  is(el.handler(), 42);
  is(el.getAttribute('handler'), null);
});

test("default: web component prop (string as property)", async () => {
  class XStr extends HTMLElement { constructor() { super() } }
  customElements.define('x-str', XStr);

  let el = h`<x-str :label="l"></x-str>`;
  sprae(el, { l: 'hello' });

  // all types should be set as properties on custom elements
  is(el.label, 'hello');
});

test("default: web component prop (number as property)", async () => {
  class XNum extends HTMLElement { constructor() { super() } }
  customElements.define('x-num', XNum);

  let el = h`<x-num :count="n"></x-num>`;
  sprae(el, { n: 42 });

  // numbers should be set as properties on custom elements
  is(el.count, 42);
});

test("default: spread all types as properties on web component", async () => {
  class XSpreadAll extends HTMLElement { constructor() { super() } }
  customElements.define('x-spread-all', XSpreadAll);

  let fn = () => 'hi';
  let el = h`<x-spread-all :="{ items, label, count, onClick }" ></x-spread-all>`;
  sprae(el, { items: [1, 2], label: 'test', count: 5, onClick: fn });

  is(el.items, [1, 2]);
  is(el.label, 'test');
  is(el.count, 5);
  is(typeof el.onClick, 'function');
  is(el.onClick(), 'hi');
});

// --- Custom element with _state: all directives must still be processed ---

test("default: web component with _state processes all directives", async () => {
  // Simulates define-element scenario: processor sets _state in connectedCallback,
  // then parent sprae processes directives on the element (prop setters)
  let propLog = [];
  customElements.define('x-proc1', class extends HTMLElement {
    constructor() { super() }
    set name(v) { propLog.push('name:' + v); if (this[_state]) this[_state].name = v }
    set count(v) { propLog.push('count:' + v); if (this[_state]) this[_state].count = v }
  });

  let el = h`<div><x-proc1 :name="n" :count="c"></x-proc1></div>`;
  let ce = el.querySelector('x-proc1')

  // simulate processor: hide parent directives, run sprae on defaults, restore
  let saved = [...ce.attributes].reduce((a, {name, value}) =>
    (name[0] === ':' && (ce.removeAttribute(name), a.push([name, value])), a), [])
  ce.innerHTML = '<span :text="name"></span>'
  ce[_state] = sprae(ce, { name: '', count: 0 })
  for (let [n, v] of saved) ce.setAttribute(n, v)

  propLog.length = 0
  let state = sprae(el, { n: 'Ada', c: 42 });
  await tick();

  // both directives should be processed, not just the first one
  ok(propLog.includes('name:Ada'), 'name prop should be set');
  ok(propLog.includes('count:42'), 'count prop should be set — not skipped by _state check');

  // template should reflect prop update
  is(ce.querySelector('span').textContent, 'Ada');
});

// sprae() called on custom element that already has _state — must process directives
// simulates :each clone scenario: processor ran, then parent sprae processes directives
test("default: sprae() on web component with existing _state processes directives", async () => {
  customElements.define('x-resprae', class extends HTMLElement {
    constructor() { super() }
    set label(v) { if (this[_state]) this[_state].label = v }
    set count(v) { if (this[_state]) this[_state].count = v }
  });

  // simulate processor: element has _state and inner template
  let ce = document.createElement('x-resprae')
  ce.innerHTML = '<b :text="label"></b><em :text="count"></em>'
  ce[_state] = sprae(ce, { label: '?', count: 0 })
  is(ce.querySelector('b').textContent, '?')

  // simulate :each clone scenario: parent directives restored on element after processor
  ce.setAttribute(':label', 'name')
  ce.setAttribute(':count', 'num')
  // sprae(clone, subscope) — subscope has the variables from parent
  sprae(ce, { name: 'Ada', num: 42 })
  await tick();

  // directives should have been processed, updating component state via setters
  is(ce.querySelector('b').textContent, 'Ada')
  is(ce.querySelector('em').textContent, '42')
});


// --- define-element processor pattern ---
// Simulates define-element: processor(root, state) clones template and calls sprae(root, state).
// Parent sprae then processes directives on the CE as prop setters.

// Helper: simulates define-element processor pattern.
// In real define-element, connectedCallback calls processor(root, state).
// Here we simulate by using attributeChangedCallback with microtask batching,
// matching the actual define-element integration pattern.
const defineWithSprae = (tag, tpl, props) => {
  customElements.define(tag, class extends HTMLElement {
    static observedAttributes = props
    attributeChangedCallback(k, _, v) {
      if (this[_state]) { this[_state][k] = v; return }
      if (this._q) return
      this._q = true
      queueMicrotask(() => {
        this._q = false
        // processor: mount template and sprae with initial state
        this.innerHTML = tpl
        let state = {}
        for (let p of props) state[p] = this[`_$${p}`] ?? this.getAttribute(p)
        this[_state] = sprae(this, state)
      })
    }
  })
  // property setters for object props
  let C = customElements.get(tag)
  for (let p of props) Object.defineProperty(C.prototype, p, {
    set(v) {
      if (this[_state]) this[_state][p] = v
      else {
        this[`_$${p}`] = v
        if (!this._q) {
          this._q = true
          queueMicrotask(() => {
            this._q = false
            this.innerHTML = tpl
            let state = {}
            for (let pp of props) state[pp] = this[`_$${pp}`] ?? this.getAttribute(pp)
            this[_state] = sprae(this, state)
          })
        }
      }
    },
    get() { return this[_state]?.[p] ?? this[`_$${p}`] }
  })
}

test("define-element: basic rendering", async () => {
  defineWithSprae('de-basic', '<span :text="name"></span>', ['name'])

  let el = h`<div><de-basic :name="n"></de-basic></div>`
  let state = sprae(el, { n: 'Ada' })
  await tick(2)

  is(el.querySelector('span').textContent, 'Ada')
});

test("define-element: reactive prop update", async () => {
  defineWithSprae('de-reactive', '<b :text="label"></b><em :text="count"></em>', ['label', 'count'])

  let el = h`<div><de-reactive :label="l" :count="c"></de-reactive></div>`
  let state = sprae(el, { l: 'hello', c: 1 })
  await tick(2)

  is(el.querySelector('b').textContent, 'hello')
  is(el.querySelector('em').textContent, '1')

  state.l = 'world'
  state.c = 42
  await tick()
  is(el.querySelector('b').textContent, 'world')
  is(el.querySelector('em').textContent, '42')
});

test("define-element: object prop via property", async () => {
  defineWithSprae('de-objprop', '<span :text="item.name"></span>', ['item'])

  let el = h`<div><de-objprop :item="obj"></de-objprop></div>`
  let state = sprae(el, { obj: { name: 'test' } })
  await tick(2)

  is(el.querySelector('span').textContent, 'test')

  state.obj = { name: 'updated' }
  await tick()
  is(el.querySelector('span').textContent, 'updated')
});

test("define-element: multiple instances", async () => {
  defineWithSprae('de-multi', '<span :text="value"></span>', ['value'])

  let el = h`<div>
    <de-multi :value="a"></de-multi>
    <de-multi :value="b"></de-multi>
  </div>`
  let state = sprae(el, { a: 'first', b: 'second' })
  await tick(2)

  let spans = el.querySelectorAll('span')
  is(spans[0].textContent, 'first')
  is(spans[1].textContent, 'second')

  state.a = 'updated'
  await tick()
  is(spans[0].textContent, 'updated')
  is(spans[1].textContent, 'second')
});

test("define-element: multiple instances via loop", async () => {
  // In real DOM, define-element processor runs synchronously in connectedCallback.
  // Here we simulate: pre-create instances with _state, then parent sprae sets props.
  let tag = 'de-loop'
  customElements.define(tag, class extends HTMLElement {
    constructor() { super() }
    set label(v) { if (this[_state]) this[_state].label = v }
  })

  let el = h`<div></div>`
  let state = sprae(el, { items: ['a', 'b', 'c'] })

  // simulate define-element processor: each clone gets template + sprae before parent sets props
  for (let item of state.items) {
    let ce = document.createElement(tag)
    ce.innerHTML = '<span :text="label"></span>'
    ce[_state] = sprae(ce, { label: item })
    el.appendChild(ce)
  }
  await tick()

  let spans = el.querySelectorAll('span')
  is(spans.length, 3)
  is(spans[0].textContent, 'a')
  is(spans[1].textContent, 'b')
  is(spans[2].textContent, 'c')
});

test("define-element: isolation (parent does not descend)", async () => {
  defineWithSprae('de-iso', '<span :text="inner"></span>', ['inner'])

  // parent has variable `outer`, but component template uses `inner`
  let el = h`<div><de-iso :inner="outer"></de-iso></div>`
  sprae(el, { outer: 'from-parent' })
  await tick(2)

  is(el.querySelector('span').textContent, 'from-parent')
});

test("define-element: callback prop", async () => {
  defineWithSprae('de-callback', '<button :onclick="handler?.()"></button>', ['handler'])

  let log = []
  let el = h`<div><de-callback :handler="fn"></de-callback></div>`
  sprae(el, { fn: () => log.push('clicked') })
  await tick(2)

  el.querySelector('button').click()
  is(log, ['clicked'])
});
