import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";

test("value: direct", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: 1, console });
  is(el.value, "1");
  is(el.outerHTML, `<input value="1">`);
  state.a = 2;
  await tick();
  is(el.value, "2");
  is(el.outerHTML, `<input value="2">`);

  el.value = 3;
  el.dispatchEvent(new window.Event('change'))
  is(state.a, '3')
});

test("value: checkbox", async () => {
  let el = h`<input type="checkbox" :value="a" />`;
  let state = sprae(el, { a: true });
  is(el.value, 'on');
  is(el.outerHTML, `<input type="checkbox" checked="">`);
  is(el.checked, true);
  state.a = false
  await tick()
  is(el.checked, false);
  is(el.outerHTML, `<input type="checkbox">`);

  el.checked = true;
  el.dispatchEvent(new window.Event('change'))
  is(state.a, true)
});

test("value: textarea", async () => {
  let el = h`<textarea :value="a"></textarea>`;
  let state = sprae(el, { a: "abcdefgh" });
  is(el.selectionStart, 8);
  is(el.selectionEnd, 8);
  el.setSelectionRange(1, 4);
  is(el.selectionStart, 1);
  is(el.selectionEnd, 4);
  state.a = "xyzyvw";
  is(el.selectionStart, 1);
  is(el.selectionEnd, 4);
});

test('value: select each #48', async () => {
  let el = h`
  <select class="form-control" :name="field.name" :value="object[field.name]">
      <option :each="option in field.options" :value="option.value"
              :text="option.label"></option>
  </select>`

  sprae(el, {
    field: { name: 'x', options: [{ value: 1, label: 'a' }, { value: 2, label: 'b' }] },
    object: { x: 123 }
  })

  is(el.outerHTML, `<select class="form-control" name="x"><option value="1">a</option><option value="2">b</option></select>`)
})
