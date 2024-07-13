import test, { is, any, throws } from "tst";
import { tick, time } from "wait-please";
import sprae from '../sprae.js'
import { signal, batch, untracked, effect } from '../signal.js'
import h from "hyperf";


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
