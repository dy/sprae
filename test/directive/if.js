import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'

// import * as signals from '@preact/signals-core'
// use(signals)

const _dispose = Symbol.dispose;


test("if: base", async () => {
  let el = h`<p>
    <if :if="a==1">a</if>
    <elif :else :if="a==2">b</elif>
    <else :else >c</else>
  </p>`;

  const params = sprae(el, { a: 1 });
  // await tick();

  is(el.innerHTML, "<if>a</if>");

  console.log('----a.value = 2')
  params.a = 2;
  await tick();
  is(el.innerHTML, "<elif>b</elif>");

  console.log('----a.value = 3')
  params.a = 3;
  await tick();
  is(el.innerHTML, "<else>c</else>");

  console.log('----a.value = null')
  params.a = null;
  await tick();
  is(el.innerHTML, "<else>c</else>");
});

test("if: overlapping conditions", async () => {
  let el = h`<p>
    <if :if="a<1">a</if>
    <elif2 :else :if="a<2">b</elif2>
    <elif3 :else :if="a<3">c</elif3>
    <else :else >d</else>
  </p>`;

  const params = sprae(el, { a: 0 });
  await tick(2);

  is(el.innerHTML, "<if>a</if>");
  console.log('---a.value = 1')
  params.a = 1;
  await tick(2);
  is(el.innerHTML, "<elif2>b</elif2>");

  console.log('---a.value = 2')
  params.a = 2;
  await tick(2);
  is(el.innerHTML, "<elif3>c</elif3>");

  console.log('---a.value = 1')
  params.a = 1;
  await tick(2);
  is(el.innerHTML, "<elif2>b</elif2>");

  console.log('---a.value = 3')
  params.a = 3;
  await tick(2);
  is(el.innerHTML, "<else>d</else>");

  console.log('---a.value = 2')
  params.a = 2;
  await tick(2);
  is(el.innerHTML, "<elif3>c</elif3>");

  console.log('---a.value = null')
  params.a = null;
  await tick(2);
  is(el.innerHTML, "<if>a</if>");
});

test("if: template / fragment", async () => {
  let el = h`<p>
    <template id="tpl-if" :if="a==1">a<x>1</x></template>
    <template id="tpl-elif" :else :if="a==2">b<x>2</x></template>
    <template id="tpl-else" :else >c<x>3</x></template>
  </p>`;

  const params = sprae(el, { a: 1 });
  // await tick();

  is(el.innerHTML, "a<x>1</x>");

  console.log('--------params.a = 2')
  params.a = 2;
  await tick();
  is(el.innerHTML, "b<x>2</x>");

  console.log('--------params.a = 3')
  params.a = 3;
  await tick();
  is(el.innerHTML, "c<x>3</x>");

  console.log('--------params.a = null')
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
  // await tick();

  is(el.innerHTML, "<span>1:1</span>");

  console.log('----a.value = 2')
  params.a = 2;
  await tick();
  is(el.innerHTML, "<span>2:2</span>");

  console.log('----a.value = 3')
  params.a = 3;
  await tick();
  is(el.innerHTML, "<span>3:3</span>");

  console.log('----a.value = 4')
  params.a = 4;
  await tick();
  is(el.innerHTML, "<span>3:4</span>");

  console.log('----a.value = 1')
  params.a = 1;
  await tick();
  is(el.innerHTML, "<span>1:1</span>");

  console.log('----a.value = 4')
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
  // await tick();

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
  // await tick();
  is(x.outerHTML, `<x><z>123</z></x>`);
});

test("if: + :scope doesnt prevent secondary effects from happening", async () => {
  let el = h`<div><x :if="x" :scope="{}" :text="x"></x></div>`;
  let state = sprae(el, { x: "" });
  // await tick();
  is(el.innerHTML, ``);
  console.log("state.x=123");
  state.x = "123";
  await tick();
  is(el.innerHTML, `<x>123</x>`);
});

test("if: + :scope back-forth on/off", async () => {
  let el = h`<div>
    <x :if="x" :scope="{x}" :text="console.log(':text1'),x" :onx="()=>(x+=x)"></x>
    <y :else :scope="console.log(':scope2'),{t:'y'}" :text="console.log(':text2'),t" :onx="()=>(console.log(':onx'),t+=t)"></y>
  </div>`;
  let state = sprae(el, { x: "" });
  await tick();

  is(el.innerHTML, `<y>y</y>`);
  await tick()

  console.log("----dispatch x");
  el.children[0].dispatchEvent(new window.CustomEvent('x'))
  await tick()
  is(el.innerHTML, `<y>yy</y>`);

  console.log("----x='x'");
  state.x = "x";
  await tick();
  is(el.innerHTML, `<x>x</x>`);

  console.log('----dispatch child x')
  el.children[0].dispatchEvent(new window.CustomEvent('x'))
  await tick()
  is(el.innerHTML, `<x>xx</x>`);

  console.log('----x=""')
  state.x = ''
  await tick()
  is(el.innerHTML, `<y>yy</y>`);

  console.log('----dispatch child x')
  el.children[0].dispatchEvent(new window.CustomEvent('x'))
  await tick()
  is(el.innerHTML, `<y>yyyy</y>`);

  el[_dispose]()
  is(el.innerHTML, `<y>yyyy</y>`);
});

test("if: :scope + :if after attributes", async () => {
  let el = h`<c>
    <x :scope="{x:1}" :if="cur === 1" :text="x"></x>
    <y :scope="{x:2}" :if="cur === 2" :text="x"></y>
  </c>`

  let s = sprae(el, { cur: 1 })
  await tick(2);
  is(el.innerHTML, `<x>1</x>`)

  console.log('------- s.cur = 2')
  s.cur = 2
  await tick(2)
  is(el.innerHTML, `<y>2</y>`)
})

test("if: set/unset value", async () => {
  let el = h`<x><y :if="x" :text="x?.x"></y></x>`
  let state = sprae(el, { x: null })
  await tick(2);
  is(el.innerHTML, '')
  state.x = { x: 1 }
  await tick()
  is(el.innerHTML, '<y>1</y>')
  console.log('------state.x = null')
  // NOTE: @preact/signals unsubscribes x.x
  state.x = null
  await tick()
  is(el.innerHTML, '')
  console.log('------state.x = {x:2}')
  state.x = { x: 2 }
  await tick()
  is(el.innerHTML, '<y>2</y>')
})

test("if: set/unset 2", async () => {
  let el = h`<root><x :if="x==1"><t :text="a"></t></x><y :else :if="x==2"><t :text="b"></t></y><z :else :text="c"></z></root>`
  let state = sprae(el, { x: 1, a: 'a', b: 'b', c: 'c' })
  // await tick()
  is(el.innerHTML, '<x><t>a</t></x>', 'x==1')

  console.log('----state.x = null')
  state.x = null
  await tick(2) // FIXME: 2 ticks - why? chain of delays?
  console.log(123123, el.innerHTML)
  is(el.innerHTML, `<z>c</z>`, 'x==null')

  console.log('----state.x = 1')
  state.x = 1
  await tick()
  is(el.innerHTML, '<x><t>a</t></x>', 'x==1')

  console.log('----state.x = aa')
  state.a = 'aa'
  await tick()
  is(el.innerHTML, '<x><t>aa</t></x>', 'x==1')

  console.log('------state.x = 2')
  state.x = 2
  await tick()
  is(el.innerHTML, '<y><t>b</t></y>', 'x==2')

  state.b = 'bb'
  await tick()
  is(el.innerHTML, '<y><t>bb</t></y>', 'x==2')

  state.a = 'aaa'
  await tick()

  state.x = 1
  await tick()
  is(el.innerHTML, '<x><t>aaa</t></x>', 'x==1')

  state.x = 3
  await tick()
  is(el.innerHTML, '<z>c</z>', 'x==9')
})

test("if: cycle case 1", async () => {
  let el = h`<root><x :if="x==1">a</x><y :else :if="x==2">b</y></root>`
  let state = sprae(el, { x: 1 })
  // await tick()
  is(el.innerHTML, '<x>a</x>', 'x==1')

  console.log('------state.x = 2')
  state.x = 2
  await tick()
  is(el.innerHTML, '<y>b</y>', 'x==2')

  console.log('------state.x = 1')
  state.x = 1
  await tick()
  is(el.innerHTML, '<x>a</x>', 'x==1')

  console.log('------state.x = 3')
  state.x = 3
  await tick()
  is(el.innerHTML, '', 'x==9')
})

test("if: cycle case 2", async () => {
  let el = h`<root><x :if="x==1">a</x><z :else :text="c"></z></root>`
  let state = sprae(el, { x: 1, a: 'a', b: 'b', c: 'c' })
  // await tick()
  is(el.innerHTML, '<x>a</x>', 'x==1')

  console.log('----state.x = 3')
  state.x = 3
  await tick()
  is(el.innerHTML, `<z>c</z>`, 'x==3')

  // state.x = 4
  // await tick()
  // is(el.innerHTML, `<z>c</z>`, 'x==4')

  console.log('----state.x = 1')
  state.x = 1
  await tick()
  is(el.innerHTML, '<x>a</x>', 'x==1')

  console.log('----state.x = 5')
  state.x = 5
  await tick()
  is(el.innerHTML, '<z>c</z>', 'x==5')
})

test("if: #59", async () => {
  let el = h`<div id="container">
    <div :if="test()">123</div>
    ABC
    <div :if="test()">456</div>
  </div>`
  sprae(el, { test: () => true })
  // await tick();
  is(el.innerHTML, `<div>123</div>ABC<div>456</div>`)
})

test("if: init on itself", async () => {
  let el = h`<root><x :if="x==1" :onx="log.push('onx')" :foo="">a</x></root>`
  let xel = el.firstChild
  let state = sprae(xel, { x: 1, log: [] })
  await tick()
  is(el.innerHTML, `<x>a</x>`)
  xel.dispatchEvent(new window.CustomEvent('x'))
  is(state.log, ['onx'], 'event')

  console.log('--------x=2')
  state.x = 2
  await tick()
  is(el.innerHTML, ``)
  xel.dispatchEvent(new window.CustomEvent('x'))
  is(state.log, ['onx'], 'event')

  console.log('--------x=1')
  state.x = 1
  await tick()
  is(el.innerHTML, `<x>a</x>`)
  xel.dispatchEvent(new window.CustomEvent('x'))
  is(state.log, ['onx', 'onx'], 'event')
})

test("if: events when not matched", async () => {
  let el = h`<root>
    <x :if="x==1" :onx="log.push('onx')">a</x>
    <y :else :if="x==2" :ony="log.push('ony')">b</y>
  </root>`
  let [xel, yel] = el.children
  let state = sprae(el, { x: 1, log: [] })
  // await tick()
  xel.dispatchEvent(new window.CustomEvent('x'))
  yel.dispatchEvent(new window.CustomEvent('y'))
  is(state.log, ['onx'], 'event')

  console.log('------state.x = 2')
  state.x = 2
  await tick()
  xel.dispatchEvent(new window.CustomEvent('x'))
  yel.dispatchEvent(new window.CustomEvent('y'))
  is(state.log, ['onx','ony'], 'event')

  console.log('------state.x = 1')
  state.x = 1
  await tick()
  xel.dispatchEvent(new window.CustomEvent('x'))
  yel.dispatchEvent(new window.CustomEvent('y'))
  is(state.log, ['onx','ony','onx'], 'event')

  console.log('------state.x = 2')
  state.x = 2
  await tick()
  xel.dispatchEvent(new window.CustomEvent('x'))
  yel.dispatchEvent(new window.CustomEvent('y'))
  is(state.log, ['onx','ony','onx','ony'], 'event')
})

test("if: else edge case", async () => {
  let el = h`<x>
      <if :if="a==1" :text="'1:'+a"></if>
      <elif :else :if="a==2" :text="'2:'+a"></elif>
      <else :else :text="a"></else>
    </x>`
  sprae(el, { a: 3 });
  await tick(3)
  is(el.outerHTML, `<x><else>3</else></x>`)
})

test("if: big gaps", async () => {
  // h`` is too good - it auto-trims spaces
  const html = `<x>
      <if :if="a==1"></if>
      <elif :else :if="a==2"></elif>
      <else :else ></else>
    </x>`;
  const tmpl = document.createElement('template');
  tmpl.innerHTML = html.trim();
  let el = tmpl.content.firstElementChild;
  let state = sprae(el, { a: 3 });
  await tick()
  is(el.innerHTML.trim(), `<else></else>`)
  state.a = 1
  await tick()
  is(el.innerHTML.trim(), `<if></if>`)
  state.a = 2
  await tick()
  is(el.innerHTML.trim(), `<elif></elif>`)
  state.a = 3
  await tick()
  is(el.innerHTML.trim(), `<else></else>`)
})
