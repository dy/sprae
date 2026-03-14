import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { signal } from '../../core.js'


test("change: text input", async () => {
  let el = h`<input :value="x" :change="v => x = v" />`;
  let state = sprae(el, { x: 'hello' });
  is(el.value, 'hello');

  el.value = 'world';
  el.dispatchEvent(new window.Event('input'));
  is(state.x, 'world');
});

test("change: number coercion", async () => {
  let el = h`<input type="number" :value="num" :change="v => num = v" />`;
  let state = sprae(el, { num: 42 });
  is(el.value, '42');

  el.value = '75';
  el.dispatchEvent(new window.Event('change'));
  is(state.num, 75, 'coerced to number');
});

test("change: checkbox", async () => {
  let el = h`<input type="checkbox" :value="agreed" :change="v => agreed = v" />`;
  let state = sprae(el, { agreed: false });
  is(el.checked, false);

  el.checked = true;
  el.dispatchEvent(new window.Event('change'));
  is(state.agreed, true);

  el.checked = false;
  el.dispatchEvent(new window.Event('change'));
  is(state.agreed, false);
});

test("change: radio group", async () => {
  let container = h`<div>
    <input type="radio" name="group" value="a" :value="selected" :change="v => selected = v" />
    <input type="radio" name="group" value="b" :value="selected" :change="v => selected = v" />
    <input type="radio" name="group" value="c" :value="selected" :change="v => selected = v" />
  </div>`;

  let state = sprae(container, { selected: "b" });
  let [r1, r2, r3] = container.children;

  is(r2.checked, true);

  r1.checked = true;
  r1.dispatchEvent(new window.Event('change'));
  is(state.selected, 'a');
});

test("change: select one", async () => {
  let el = h`<select :value="sel" :change="v => sel = v">
    <option value="1">a</option>
    <option value="2">b</option>
  </select>`;

  let state = sprae(el, { sel: '2' });
  await tick();
  is(el.value, '2');

  el.value = '1';
  el.dispatchEvent(new window.Event('change'));
  is(state.sel, '1');
});

test("change: select multiple", async () => {
  let el = h`<select multiple :value="items" :change="v => items = v">
    <option value="a">A</option>
    <option value="b">B</option>
    <option value="c">C</option>
  </select>`;

  let state = sprae(el, { items: ['a', 'c'] });
  await tick();

  // simulate selecting b and c
  el.options[0].selected = false;
  el.options[1].selected = true;
  el.options[2].selected = true;
  el.dispatchEvent(new window.Event('change'));
  is(state.items, ['b', 'c']);
});

test("change: date keeps string", async () => {
  let el = h`<input type="date" :value="d" :change="v => d = v" />`;
  let state = sprae(el, { d: '2025-06-15' });
  is(el.value, '2025-06-15');

  el.value = '2026-01-01';
  el.dispatchEvent(new window.Event('input'));
  is(state.d, '2026-01-01', 'date stays as string');
});

test("change: textarea", async () => {
  let el = h`<textarea :value="text" :change="v => text = v"></textarea>`;
  let state = sprae(el, { text: 'hello' });
  is(el.value, 'hello');

  el.value = 'updated';
  el.dispatchEvent(new window.Event('input'));
  is(state.text, 'updated');
});

test("change: with debounce modifier", async () => {
  let el = h`<input :value="x" :change.debounce-10="v => x = v" />`;
  let state = sprae(el, { x: 'init' });
  is(el.value, 'init');

  el.value = 'a';
  el.dispatchEvent(new window.Event('input'));
  el.value = 'b';
  el.dispatchEvent(new window.Event('input'));
  el.value = 'c';
  el.dispatchEvent(new window.Event('input'));
  // debounced — not yet updated
  is(state.x, 'init');

  await time(15);
  is(state.x, 'c', 'debounce takes last value');
});

test("change: coexists with :oninput", async () => {
  let el = h`<input :value="x" :change="v => x = v" :oninput="e => log.push(e.type)" />`;
  let state = sprae(el, { x: 'init', log: [] });

  el.value = 'hello';
  el.dispatchEvent(new window.Event('input'));
  is(state.x, 'hello', 'change handler fired');
  is(state.log, ['input'], 'oninput handler also fired');
});

test("change: inline statement", async () => {
  let el = h`<input :value="x" :change="x = __" />`;
  // FIXME: `:change` expects a function — statement form would need the coerced value injected somehow
  // For now, function form is the primary API
});

test("change: two-way roundtrip", async () => {
  let el = h`<input :value="x" :change="v => x = v" />`;
  let state = sprae(el, { x: 'init' });
  is(el.value, 'init');

  // state → DOM
  state.x = 'from-state';
  await tick();
  is(el.value, 'from-state');

  // DOM → state
  el.value = 'from-dom';
  el.dispatchEvent(new window.Event('input'));
  is(state.x, 'from-dom');

  // roundtrip back
  await tick();
  is(el.value, 'from-dom');
});
