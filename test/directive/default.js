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
