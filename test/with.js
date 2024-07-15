import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import { signal } from '../signal.js'
import h from "hyperf";


test("with: inline assign", async () => {
  let el = h`<x :with="{foo:'bar'}"><y :text="foo + baz"></y></x>`;
  let state = sprae(el, { baz: signal("qux") });
  is(el.innerHTML, `<y>barqux</y>`);
  state.baz = "quux";
  await tick();
  is(el.innerHTML, `<y>barquux</y>`);
});

test("with: inline assign reactive", async () => {
  let el = h`<x :with="{foo:'bar'}"><y :text="foo + baz"></y></x>`;
  let baz = signal("qux");
  sprae(el, { baz });
  is(el.innerHTML, `<y>barqux</y>`);
  baz.value = "quux";
  await tick()
  is(el.innerHTML, `<y>barquux</y>`);
});

test("with: assign data", async () => {
  let el = h`<x :with="{foo:x.foo}"><y :text="foo"></y></x>`;
  let state = sprae(el, { console, x: { foo: "bar" } });
  is(el.innerHTML, `<y>bar</y>`);
  state.x.foo = "baz";
  await tick();
  // Object.assign(state, { x: { foo: 'baz' } })
  is(el.innerHTML, `<y>baz</y>`);
});

test("with: assign transparency", async () => {
  let el = h`<x :with="{foo:'foo'}"><y :with="{bar:b.bar}" :text="foo+bar"></y></x>`;
  let params = sprae(el, { b: { bar: "bar" } });
  is(el.innerHTML, `<y>foobar</y>`);
  params.b.bar = "baz";
  await tick();
  is(el.innerHTML, `<y>foobaz</y>`);
});

test("with: reactive transparency", async () => {
  let el = h`<x :with="{foo:1}"><y :with="{bar:b.c.bar}" :text="foo+bar"></y></x>`;
  const bar = signal("2");
  sprae(el, { b: { c: { bar } } });
  is(el.innerHTML, `<y>12</y>`);
  bar.value = "3";
  await tick()
  is(el.innerHTML, `<y>13</y>`);
});

test("with: writes to state", async () => {
  let a = h`<x :with="{a:1}"><y :onx="e=>(a+=1)" :text="a"></y></x>`;
  sprae(a, { console, signal });
  is(a.innerHTML, `<y>1</y>`);
  a.firstChild.dispatchEvent(new window.Event("x"));
  await tick();
  is(a.innerHTML, `<y>2</y>`);
  a.firstChild.dispatchEvent(new window.Event("x"));
  await tick();
  is(a.innerHTML, `<y>3</y>`);
});

test("with: one of children (internal number of iterations, cant see the result here)", async () => {
  let a = h`<div><x :text="x"></x><x :with="{x:2}" :text="x"></x><x :text="y">3</x></div>`;
  sprae(a, { x: 1, y: 3 });
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});

test("with: scope directives must come first", async () => {
  // NOTE: we have to init attributes in order of definition
  let a = h`<x :with="{y:1}" :text="y" :ref="x"></x>`;
  sprae(a, {});
  is(a.outerHTML, `<x>1</x>`);
});
