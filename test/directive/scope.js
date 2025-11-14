import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'


test("scope: inline assign", async () => {
  let el = h`<x :scope="foo='bar'"><y :text="console.log('effect text',foo),foo + baz"></y></x>`;
  let state = sprae(el, { baz: signal("qux") });
  is(el.innerHTML, `<y>barqux</y>`);
  // FIXME is(state, {baz: "qux"}, "does not leak to parent scope");
  state.baz = "quux";
  await tick();
  is(el.innerHTML, `<y>barquux</y>`);
});

test("scope: inline assign reactive", async () => {
  let el = h`<x :scope="{foo:'bar'}"><y :text="foo + baz"></y></x>`;
  let baz = signal("qux");
  sprae(el, { baz });
  is(el.innerHTML, `<y>barqux</y>`);
  baz.value = "quux";
  await tick()
  is(el.innerHTML, `<y>barquux</y>`);
});

test("scope: assign data", async () => {
  let el = h`<x :scope="{foo:x.foo}"><y :text="foo"></y></x>`;
  let state = sprae(el, { console, x: { foo: "bar" } });
  await tick();
  is(el.innerHTML, `<y>bar</y>`);
  console.log('---state.x.foo = \'baz\'')
  state.x.foo = "baz";
  await tick(2);
  // Object.assign(state, { x: { foo: 'baz' } })
  is(el.innerHTML, `<y>baz</y>`);
});

test("scope: assign transparency", async () => {
  let el = h`<x :scope="{foo:'foo'}"><y :scope="{bar:b.bar}" :text="foo+bar"></y></x>`;
  let params = sprae(el, { b: { bar: "bar" } });
  is(el.innerHTML, `<y>foobar</y>`);
  params.b.bar = "baz";
  await tick();
  is(el.innerHTML, `<y>foobaz</y>`);
});

test("scope: reactive transparency", async () => {
  let el = h`<x :scope="{foo:1}"><y :scope="{bar:b.c.bar}" :text="foo+bar"></y></x>`;
  const bar = signal("2");
  sprae(el, { b: { c: { bar } } });
  is(el.innerHTML, `<y>12</y>`);

  console.log('------------ bar.value = 3')
  bar.value = "3";
  await tick()
  is(el.innerHTML, `<y>13</y>`);
});

test("scope: writes to state", async () => {
  let a = h`<x :scope="{a:1}"><y :onx="e=>(a+=1)" :text="a"></y></x>`;
  sprae(a, { console, signal });
  is(a.innerHTML, `<y>1</y>`);
  a.firstChild.dispatchEvent(new window.Event("x"));
  await tick();
  is(a.innerHTML, `<y>2</y>`);
  a.firstChild.dispatchEvent(new window.Event("x"));
  await tick();
  is(a.innerHTML, `<y>3</y>`);
});

test("scope: one of children (internal number of iterations, cant see the result here)", async () => {
  let a = h`<div><x :text="x"></x><y :scope="{x:2}" :text="x"></y><z :text="y">3</z></div>`;
  let state = sprae(a, { x: 1, y: 3 });
  is(state, {x: 1, y: 3}, "does not leak to parent scope");
  is(a.innerHTML, `<x>1</x><y>2</y><z>3</z>`);
});

test("scope: scope directives must come first", async () => {
  // NOTE: we have to init attributes in order of definition
  let a = h`<x :scope="{y:1}" :text="y" :ref="el=>x=el"></x>`;
  sprae(a, { x: null });
  is(a.outerHTML, `<x>1</x>`);
});

test("scope: new prop added to parent state", async () => {
  let a = h`<x :scope="{y:0}" :ony="()=>y=1"><a :if="y" :text="x"></a></x>`
  let state = sprae(a, {})
  is(a.innerHTML, ``)
  state.x = 1
  a.dispatchEvent(new window.Event('y'))
  await tick()
  is(a.innerHTML, `<a>1</a>`)
})

test('scope: parasitic updates', async () => {
  let a = h`<x :scope="x=''"><y :fx="x='x'" :text="x+y"></y></x>`
  let s = sprae(a, { y: 'y' })
  await tick()
  is(a.innerHTML, `<y>xy</y>`)
  s.y = 'yy'
  await tick()
  is(a.innerHTML, `<y>xyy</y>`)
})
