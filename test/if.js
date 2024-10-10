import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import { signal } from '../signal.js'
import h from "hyperf";

test("if: base", async () => {
  let el = h`<p>
    <if :if="a==1">a</if>
    <elif :else :if="a==2">b</elif>
    <else :else >c</else>
  </p>`;

  const params = sprae(el, { a: 1 });

  is(el.innerHTML, "<if>a</if>");
  console.log('a.value = 2')
  params.a = 2;
  await tick();
  is(el.innerHTML, "<elif>b</elif>");
  params.a = 3;
  await tick();
  is(el.innerHTML, "<else>c</else>");
  params.a = null;
  await tick();
  is(el.innerHTML, "<else>c</else>");
});

test("if: template / fragment", async () => {
  let el = h`<p>
    <template :if="a==1">a<x>1</x></template>
    <template :else :if="a==2">b<x>2</x></template>
    <template :else >c<x>3</x></template>
  </p>`;

  const params = sprae(el, { a: 1 });

  is(el.innerHTML, "a<x>1</x>");
  console.log('params.a = 2')
  params.a = 2;
  await tick();
  is(el.innerHTML, "b<x>2</x>");
  params.a = 3;
  await tick();
  is(el.innerHTML, "c<x>3</x>");
  params.a = null;
  await tick();
  is(el.innerHTML, "c<x>3</x>");
});

test("if: short with insertions", async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else :if="a==2" :text="'2:'+a"></span>
    <span :else :text="'3:'+a"></span>
  </p>`;

  const params = sprae(el, { a: 1 });

  is(el.innerHTML, "<span>1:1</span>");
  params.a = 2;
  await tick();
  is(el.innerHTML, "<span>2:2</span>");
  params.a = 3;
  await tick();
  is(el.innerHTML, "<span>3:3</span>");
  params.a = 4;
  await tick();
  is(el.innerHTML, "<span>3:4</span>");

  params.a = 1;
  await tick();
  is(el.innerHTML, "<span>1:1</span>");
  params.a = 4;
  await tick();
  is(el.innerHTML, "<span>3:4</span>");

  params.a = null;
});

test("if: reactive values", async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else :if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`;

  const a = signal(1);
  sprae(el, { a });

  is(el.innerHTML, "<span>1:1</span>");
  a.value = 2;
  await tick()
  is(el.innerHTML, "<span>2:2</span>");
  a.value = 3;
  await tick()
  is(el.innerHTML, "<span>3</span>");
  a.value = 4;
  await tick()
  is(el.innerHTML, "<span>4</span>");

  a.value = 1;
  await tick()
  is(el.innerHTML, "<span>1:1</span>");
  a.value = 4;
  await tick()
  is(el.innerHTML, "<span>4</span>");
});

test("if: (#3) subsequent content is not abandoned", async () => {
  let x = h`<x><y :if="!!y"></y><z :text="123"></z></x>`;
  sprae(x, { y: false });
  is(x.outerHTML, `<x><z>123</z></x>`);
});

test("if: + :with doesnt prevent secondary effects from happening", async () => {
  let el = h`<div><x :if="x" :with="{}" :text="x"></x></div>`;
  let state = sprae(el, { x: "" });
  is(el.innerHTML, ``);
  console.log("state.x=123");
  state.x = "123";
  await tick();
  is(el.innerHTML, `<x>123</x>`);

  // NOTE: we ignore this case
  // let el2 = h`<div><x :if="x" :with="{x:cond}" :text="x"></x></div>`
  // let state2 = sprae(el, {cond:''})
  // is(el2.innerHTML, ``)
  // state2.cond = '123'
  // is(el2.innerHTML, `<x>123</x>`)
});

test("if: :with + :if after attributes", async () => {
  let el = h`<x :with="{x:1}" :if="cur === 1" :text="x"></x><x :with="{x:2}" :if="cur === 2" :text="x"></x>`

  let s = sprae(el, { cur: 1 })
  is(el.outerHTML, `<x>1</x>`)

  console.log('------- s.cur = 2')
  s.cur = 2
  is(el.outerHTML, `<x>2</x>`)
})

test.todo('if: set/unset value', async () => {
  let el = h`<x><y :if="x" :text="x?.x"></y></x>`
  let state = sprae(el, { x: null })
  is(el.innerHTML, '')
  state.x = { x: 1 }
  is(el.innerHTML, '<y>1</y>')
  console.log('------state.x = null')
  state.x = null
  is(el.innerHTML, '')
  console.log('------state.x = {x:2}')
  state.x = { x: 2 }
  is(el.innerHTML, '<y>2</y>')
})
