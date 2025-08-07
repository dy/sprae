import test, { is, ok } from "tst";
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


test("value: radio group", async () => {
  // Test radio button group behavior
  let container = h`<div>
    <input type="radio" name="group" value="a" :value="selected" />
    <input type="radio" name="group" value="b" :value="selected" />
    <input type="radio" name="group" value="c" :value="selected" />
  </div>`;

  let radio1 = container.children[0];
  let radio2 = container.children[1];
  let radio3 = container.children[2];

  let state = sprae(container, { selected: "b" });

  // Only the matching radio should be checked
  is(radio1.checked, false);
  is(radio2.checked, true);
  is(radio3.checked, false);

  // Change state to different option
  state.selected = "c";
  await tick();

  is(radio1.checked, false);
  is(radio2.checked, false);
  is(radio3.checked, true);

  // Test user selecting different radio
  radio1.checked = true;
  radio1.dispatchEvent(new window.Event('change'));
  is(state.selected, "a");

  // Verify only one radio is checked after user interaction
  await tick();
  is(radio1.checked, true);
  is(radio2.checked, false);
  is(radio3.checked, false);
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

test('value: select one', async () => {
  let el = h`
  <select :name="field.name" :value="object[field.name]">
      <option :each="option in field.options" :value="option.value"
              :text="option.label"></option>
  </select>`

  let state = sprae(el, {
    field: { name: 'x', options: [{ value: 1, label: 'a' }, { value: 2, label: 'b' }] },
    object: { x: 2 }
  })

  is(el.outerHTML, `<select name="x"><option value="1">a</option><option value="2" selected="">b</option></select>`)
  is(el.value, '2')
  is(state.object.x, 2)
})

test('value: select multiple', async () => {
  let el = h`
  <select :id:name="field.name" :value="object[field.name]" multiple>
    <option :each="option in field.options" :value="option.value"
              :text="option.label"></option>
  </select>`

  // document.body.append(el)
  sprae(el, {
    field: { name: 'x', options: [{ value: 1, label: 'a' }, { value: 2, label: 'b' }, { value: 3, label: 'c' }] },
    object: { x: [2, 3] }
  })

  is(el.outerHTML, `<select multiple="" id="x" name="x"><option value="1">a</option><option value="2" selected="">b</option><option value="3" selected="">c</option></select>`)
  is([...el.selectedOptions], [el.children[1], el.children[2]])
})

test('value: select options change #52', async () => {
  let el = h`
  <select :value="selected">
    <option :each="option in options" :value="option.value"
              :text="option.label"></option>
  </select>`

  document.body.append(el)
  let state = sprae(el, {
    options: [],
    selected: null
  })

  is(el.value, '')
  is(state.selected, null)

  console.log('-------add option 1')
  state.options.push({ value: 1, label: 'a' })
  await tick()
  is(el.value, '1')
  is(state.selected, '1')

  console.log('----------change', state.selected)
  state.options[0].value = 2
  await tick()
  is(el.value, '2')
  is(state.selected, '2')

  // console.log('------value=1')
  // el.value = 1, el.dispatchEvent(new Event('change'))
  // is(el.value, '1')
  // is(state.selected, '1')

  console.log('----------remove', state.selected)
  state.options = []
  await tick()
  is(el.value, '')
  ok(state.selected == null)

  // is(el.outerHTML, `<select multiple="" id="x" name="x"><option value="1">a</option><option value="2" selected="">b</option><option value="3" selected="">c</option></select>`)
  // is([...el.selectedOptions], [el.children[1], el.children[2]])
})

test('value: keep initial selected element #53', t => {
  let el = h`<div id="container">
      <select class="form-control" :value="obj">
          <option value="1">Test 1</option>
          <option value="2" selected="true">Test 2</option>
          <option value="3">Test 3</option>
      </select>
      <input :if="obj == 3" type="text" class="form-control"/>
  </div>`

  let s = sprae(el)

  is(el.outerHTML, `<div id="container"><select class="form-control"><option value="1">Test 1</option><option value="2" selected="">Test 2</option><option value="3">Test 3</option></select></div>`)
  is(s, {obj:'2'})
})

test("value: reflect #57", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: 0 });
  is(state.a, 0);
  is(el.outerHTML, `<input value="0">`);
});

test("value: reflect ensure value", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { });
  is(state.a, '');
  is(el.outerHTML, `<input value="">`);
});
