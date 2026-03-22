import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { signal } from '../../core.js'


test("value: one-way text", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: 1 });
  is(el.value, "1");
  is(el.outerHTML, `<input value="1">`);
  state.a = 2;
  await tick();
  is(el.value, "2");
  is(el.outerHTML, `<input value="2">`);
});

test("value: one-way checkbox", async () => {
  let el = h`<input type="checkbox" :value="a" />`;
  let state = sprae(el, { a: true });
  is(el.outerHTML, `<input type="checkbox" checked="">`);
  is(el.checked, true);
  state.a = false;
  await tick();
  is(el.checked, false);
  is(el.outerHTML, `<input type="checkbox">`);
});

test("value: one-way radio group", async () => {
  let container = h`<div>
    <input type="radio" name="group" value="a" :value="selected" />
    <input type="radio" name="group" value="b" :value="selected" />
    <input type="radio" name="group" value="c" :value="selected" />
  </div>`;

  let [r1, r2, r3] = container.children;
  let state = sprae(container, { selected: "b" });

  is(r1.checked, false);
  is(r2.checked, true);
  is(r3.checked, false);

  state.selected = "c";
  await tick();
  is(r1.checked, false);
  is(r2.checked, false);
  is(r3.checked, true);

  is(r1.value, "a");
  is(r2.value, "b");
  is(r3.value, "c");
});

test("value: textarea caret preservation", async () => {
  let el = h`<textarea :value="a"></textarea>`;
  let state = sprae(el, { a: "abcdefgh" });
  await tick();
  is(el.selectionStart, 8);
  is(el.selectionEnd, 8);
  el.setSelectionRange(1, 4);
  state.a = "xyzyvw";
  await tick();
  is(el.selectionStart, 1);
  is(el.selectionEnd, 4);
});

test("value: select one", async () => {
  let el = h`
  <select :name="field.name" :value="object[field.name]">
      <option :each="option in field.options" :value="option.value"
              :text="option.label"></option>
  </select>`

  sprae(el, {
    field: { name: 'x', options: [{ value: 1, label: 'a' }, { value: 2, label: 'b' }] },
    object: { x: 2 }
  })

  await tick()
  is(el.outerHTML, `<select name="x"><option value="1">a</option><option value="2" selected="">b</option></select>`)
  is(el.value, '2')
});

test("value: select multiple", async () => {
  let el = h`
  <select :id:name="field.name" :value="object[field.name]" multiple>
    <option :each="option in field.options" :value="option.value"
              :text="option.label"></option>
  </select>`

  sprae(el, {
    field: { name: 'x', options: [{ value: 1, label: 'a' }, { value: 2, label: 'b' }, { value: 3, label: 'c' }] },
    object: { x: [2, 3] }
  })

  is(el.outerHTML, `<select multiple="" id="x" name="x"><option value="1">a</option><option value="2" selected="">b</option><option value="3" selected="">c</option></select>`)
  is([...el.selectedOptions], [el.children[1], el.children[2]])
});

test("value: reflect #57", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: 0 });
  is(state.a, 0);
  is(el.outerHTML, `<input value="0">`);
});

test("value: number input", async () => {
  let el = h`<input type="number" :value="num" />`;
  let state = sprae(el, { num: 42 });
  is(el.value, '42');

  state.num = 100;
  await tick();
  is(el.value, '100');
});

test("value: date input", async () => {
  let el = h`<input type="date" :value="d" />`;
  let state = sprae(el, { d: '2025-06-15' });
  is(el.value, '2025-06-15');

  state.d = '2025-12-25';
  await tick();
  is(el.value, '2025-12-25');
});

test("value: text caret preserved on state update", async () => {
  let el = h`<input type="text" :value="amount" />`;
  document.body.append(el)
  let state = sprae(el, { amount: '10.00' });
  await tick()

  el.focus()
  is(el.value, '10.00')

  el.setSelectionRange(2, 2)
  state.amount = '120.00'
  await tick()
  is(el.value, '120.00')
  is(el.selectionStart, 2, 'caret stays at insert position mid-string')

  document.body.removeChild(el)
});

test('value: input :value + :oninput with :if list should not throw fn is not a function', async () => {
  let el = document.createElement('div')
  el.innerHTML = `
    <div :if="show">
      <input id="inp" type="text" :value="query"
        :onfocus="e => filter(query)"
        :oninput="e => { filter(e.target.value) }"
        :onblur="e => { hits = [] }">
      <div :if="hits.length">
        <div :each="m in hits" :text="m.name"></div>
      </div>
    </div>
  `
  document.body.appendChild(el)

  let errors = []
  let origError = console.error
  console.error = (...args) => { errors.push(args.join(' ')); origError(...args) }

  let s = sprae(el, {
    show: true,
    query: '',
    hits: [],
    filter(q) {
      this.query = q
      let all = [{id:1, name:'Alice'}, {id:2, name:'Bob'}, {id:3, name:'Carol'}]
      this.hits = q ? all.filter(m => m.name.toLowerCase().includes(q.toLowerCase())) : all
    }
  })
  await time(50)

  let inp = el.querySelector('#inp')
  inp.value = 'a'
  inp.dispatchEvent(new InputEvent('input', { bubbles: true }))
  await time(50)

  is(s.query, 'a', 'query updated')
  is(s.hits.length, 2, 'Alice and Carol match')

  inp.dispatchEvent(new FocusEvent('blur', { bubbles: true }))
  await time(50)

  is(s.hits.length, 0, 'hits cleared on blur')

  let spraeErrors = errors.filter(e => /not a function|∴ TypeError/.test(e))
  is(spraeErrors.length, 0, 'should produce no sprae errors: ' + spraeErrors.join('; '))

  console.error = origError
  el.remove()
})

test('value: reactive loop from :value + :oninput cycle', async () => {
  let el = document.createElement('div')
  el.innerHTML = `
    <input id="inp" type="text" :value="query"
      :oninput="e => { query = e.target.value; items = [1,2,3] }">
    <div :if="items.length">
      <span :each="i in items" :text="i"></span>
    </div>
  `
  document.body.appendChild(el)

  let errors = []
  let origError = console.error
  console.error = (...args) => { errors.push(args.join(' ')); origError(...args) }

  let s = sprae(el, { show: true, query: '', items: [] })
  await time(50)

  let inp = el.querySelector('#inp')
  inp.value = 'x'
  inp.dispatchEvent(new InputEvent('input', { bubbles: true }))
  await time(100)

  let loopErrors = errors.filter(e => /Reactive loop/.test(e))
  is(loopErrors.length, 0, 'should not trigger reactive loop: ' + loopErrors.join('; '))

  console.error = origError
  el.remove()
})

