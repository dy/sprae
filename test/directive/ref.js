import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { signal } from '../../core.js'


test("ref: base", async () => {
  let a = h`<a :ref="a" :fx="log.push(a)" :text="b"></a>`;
  let state = sprae(a, { log: [], b: 1 });
  await tick();
  is(state.log[0], a);
  is(a.outerHTML, `<a>1</a>`);
  state.b = 2;
  await tick();
  is(a.outerHTML, `<a>2</a>`);
  is(state.a, a, "Exposes to the state");
});

test("ref: signal", async () => {
  let a = h`<a :ref="a" :text="b"></a>`;
  let state = sprae(a, { a: signal(), b: signal(1) });
  await tick();
  is(state.a, a);
  is(a.outerHTML, `<a>1</a>`);
  state.b = 2;
  await tick();
  is(a.outerHTML, `<a>2</a>`);
  is(state.a, a, "Exposes to the state");
});

test("ref: with :each", async () => {
  let a = h`<y><x :each="item in (items)" :ref="x" :text="log.push(x), item"/></y>`;
  let state = sprae(a, { log: [], items: [1, 2, 3, 4, 5, 6, 7] });
  await tick();
  ok(state.log.length < a.children.length * 2, "no cycle");
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x><x>4</x><x>5</x><x>6</x><x>7</x>`);
});

test("ref: defines current element", async () => {
  let el = h`<x :ref="x" :text="log.push(x)"></x>`;
  let state = sprae(el, { log: [] });
  is(state.log, [el]);
});

test("ref: create in state as untracked", async () => {
  let div = h`<div :scope="scope => (local = scope, {_x:null,log(){console.log(_x)}})" :onx="log"><x :ref="_x" :text="_x?.tagName"></x></div>`;
  let state = sprae(div, {local: null})
  await tick(2)

  is(state.local._x, div.firstChild)

  div.dispatchEvent(new window.CustomEvent("x"));
  await tick(2)

  is(state.local._x, div.firstChild)
})

test("ref: create in state as direct", async () => {
  let div = h`<div :scope="scope => (local=scope, {x:null,log(){console.log(x)}})" :onx="log"><x :ref="x" :text="x?.tagName"></x></div>`;
  let state = sprae(div, {local:{}})
  is(state.local.x, div.firstChild)
  div.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(state.local.x, div.firstChild)
})

test("ref: duplicates", async () => {
  let el = h`<x><y :ref="y"></y><z :ref="y"></z></x>`
  let state = sprae(el)
  is(state.y, el.lastChild)
});

test("ref: internal path", async () => {
  let el = h`<x><y :ref="refs.y"></y></x>`
  let state = sprae(el, {refs:{}})
  is(state.refs.y, el.lastChild)
});

test("ref: callback function", async () => {
  let el = h`<x><y :ref="el => log.push(el.tagName)"></y></x>`
  let state = sprae(el, { log: [] })
  is(state.log, ['Y'])
});

test("ref: callback with setup", async () => {
  let el = h`<input :ref="el => { el.max = 100; el.value = 50 }" />`
  sprae(el)
  is(el.max, '100')
  is(el.value, '50')
});
