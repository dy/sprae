import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import { signal } from '../signal.js'
import h from "hyperf";
import { _off, _state } from "../core.js";


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
  let a = h`<y><x :each="item in items" :ref="x" :text="log.push(x), item"/></y>`;
  let state = sprae(a, { log: [], items: [1, 2, 3] });
  await tick();
  is(state.log, [...a.children]);
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});

test("ref: t̵h̵i̵s̵ ̵r̵e̵f̵e̵r̵s̵ ̵t̵o̵ defines current element", async () => {
  let el = h`<x :ref="x" :text="log.push(x)"></x>`;
  let state = sprae(el, { log: [] });
  is(state.log, [el]);
});

test("ref: fn base", async () => {
  let a = h`<a :ref="el => a=el" :fx="log.push(a)" :text="b"></a>`;
  let state = sprae(a, { log: [], b: 1, a: null });
  await tick();
  is(state.log[0], a);
  is(a.outerHTML, `<a>1</a>`);
  state.b = 2;
  await tick();
  is(a.outerHTML, `<a>2</a>`);
  is(state.a, a, "Exposes to the state");
});

test("ref: fn signal", async () => {
  let a = h`<a :ref="el => a=el" :text="b"></a>`;
  let state = sprae(a, { a: signal(), b: signal(1) });
  await tick();
  is(state.a, a);
  is(a.outerHTML, `<a>1</a>`);
  state.b = 2;
  await tick();
  is(a.outerHTML, `<a>2</a>`);
  is(state.a, a, "Exposes to the state");
});

test("ref: fn with :each", async () => {
  let a = h`<y><x :each="item in items" :scope="{x:null}" :ref="el => x=el" :text="log.push(x), item"/></y>`;
  let state = sprae(a, { log: [], items: [1, 2, 3] });
  await tick();
  is(state.log, [...a.children]);
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});

test("ref: fn unmount", async () => {
  let div = h`<div><a :if="a" :ref="el => (log.push('on'), () => log.push('off'))" :text="b"></a></div>`;
  let state = sprae(div, { log: [], b: 1, a:1});
  await tick();
  is(state.log, ['on']);
  is(div.innerHTML, `<a>1</a>`);
  console.log('----state.a=0')
  state.a = 0
  await tick();
  is(div.innerHTML, ``);
  is(state.log, ['on', 'off']);
});

test('ref: create in state as untracked', async () => {
  let div = h`<div :scope="{_x:null,log(){console.log(_x)}}" :onx="log"><x :ref="_x" :text="_x?.tagName"></x></div>`;
  let state = sprae(div)

  is(div[_state]._x, div.firstChild)
  div.dispatchEvent(new window.CustomEvent("x"));
  is(div[_state]._x, div.firstChild)
})

test('ref: create in state as direct', async () => {
  let div = h`<div :scope="{x:null,log(){console.log(x)}}" :onx="log"><x :ref="x" :text="x?.tagName"></x></div>`;
  let state = sprae(div)
  is(div[_state].x, div.firstChild)
  // reading :ref=x normally (one level) would not subscribe root, but nested one may subscribe parent :scope
  div.dispatchEvent(new window.CustomEvent("x"));
  is(div[_state].x, div.firstChild)
})

test('ref: duplicates', async () => {
  let el = h`<x><y :ref="y"></y><z :ref="y"></z></x>`
  let state = sprae(el)
  is(state.y, el.lastChild)
})
