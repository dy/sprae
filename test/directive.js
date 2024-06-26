import test, { is, any, throws } from "tst";
import { tick, time } from "wait-please";
import * as signals from '@preact/signals-core'
import sprae from '../sprae.js'
import { signal, batch, untracked, effect } from '../signal.js'
import store, { _change, _signals } from '../store.js'
import '../directive/aria.js'
import '../directive/data.js'
import h from "hyperf";

sprae.use(signals)

test("hidden: core", async () => {
  let el = h`<div :hidden="hidden"></div>`;
  let params = sprae(el, { hidden: true });
  is(el.outerHTML, `<div hidden=""></div>`);
  params.hidden = false;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("hidden: reactive", async () => {
  const hidden = signal(true);
  let el = h`<div :hidden="hidden"></div>`;
  sprae(el, { hidden });
  is(el.outerHTML, `<div hidden=""></div>`);
  hidden.value = false;
  await tick()
  is(el.outerHTML, `<div></div>`);
});

test("common: reactive", async () => {
  let el = h`<label :for="name" :text="name" ></label><input :id="name" :name="name" :type="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`;
  let params = sprae(el, { name: 'text', url: "//google.com" });
  is(
    el.outerHTML,
    `<label for="text">text</label><input id="text" name="text" type="text"><a href="//google.com"></a><img src="//google.com">`,
  );
  params.name = "email";
  await tick();
  is(
    el.outerHTML,
    `<label for="email">email</label><input id="email" name="email" type="email"><a href="//google.com"></a><img src="//google.com">`,
  );
});

test.skip('common: multiple elements', async () => {
  // NOTE: we don't support that anymore - no much value, just pass container
  let el = h`<a><x :text="'x'"></x><y :text="'y'"></y></a>`
  sprae(el.childNodes)
  is(el.innerHTML, `<x>x</x><y>y</y>`)
})

test("common: empty strings", async () => {
  let el = h`<x :="" :x=""></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("common: comments", async () => {
  let el = h`<x :="/* */" :x="/* */"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
});

test("common: newlines", async () => {
  let el = h`<x :text="
  x
  "></x>`;
  sprae(el, { x: 1 });
  is(el.outerHTML, `<x>1</x>`);
});

test.skip("common: const in on", async () => {
  let el = h`<div :onx="() => {const x=1; y=x+1}"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  is(state.y, 2);
});

test("common: const in with", async () => {
  let el = h`<div :with="{x(){let x = 1; y=x;}}" :onx="x()"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(state.y, 1);
});

test("style", async () => {
  let el = h`<x style="left: 1px" :style="style"></x>`;
  let params = sprae(el, { style: "top: 1px" });
  is(el.outerHTML, `<x style="left: 1px; top: 1px"></x>`);

  params.style = { top: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);

  params.style = { "--x": 123 };
  await tick();
  is(el.style.getPropertyValue("--x"), "123");

  params.style = { top: "1px", bottom: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 1px; bottom: 2px;"></x>`);

  params.style = { top: "2px", bottom: null };

  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);
});


test("class", async () => {
  let el = h`<x class="base" :class="a"></x><y :class="[b, c]"></y><z :class="{c:d}"></z>`;
  const c = signal("z");
  let params = sprae(el, { a: "x", b: "y", c, d: false });
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z></z>`);
  params.d = true;
  await tick();
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z class="c"></z>`);
  c.value = 'w'
  is(el.outerHTML, `<x class="base x"></x><y class="y w"></y><z class="c"></z>`);
});

test('class: maintains manually changed classes', async () => {
  let el = h`<x class="a" :class="['b',c]"></x>`
  let c = signal('c')
  sprae(el, { c })
  is(el.outerHTML, `<x class="a b c"></x>`)
  el.classList.add('d')
  is(el.outerHTML, `<x class="a b c d"></x>`)
  c.value = 'c1'
  await tick()
  is(el.outerHTML, `<x class="a b d c1"></x>`)
})

test("class: undefined value", async () => {
  let el = h`<x :class="a"></x><y :class="[b]"></y><z :class="{c}"></z>`;
  sprae(el, { a: undefined, b: undefined, c: undefined });
  is(el.outerHTML, `<x></x><y></y><z></z>`);
});

test("class: old svg fun", async () => {
  // raw html creates svganimatedstring
  let el = document.createElement("div");
  el.innerHTML = `<svg class="foo" :class="a ? 'x' : 'y'"></svg>`;

  let s = sprae(el, { a: true });
  is(el.innerHTML, `<svg class="foo x"></svg>`);
  s.a = false;
  await tick();
  is(el.innerHTML, `<svg class="foo y"></svg>`);
});

test.skip("class: interpolation", async () => {
  let el = h`<x :class="'a $<b> c-$<c>'"></x>`;
  sprae(el, { a: 'a', b: 'b', c: 0 });
  is(el.outerHTML, `<x class="a b c-0"></x>`);
});


test("props: base", async () => {
  let el = h`<input :id="0" :="{for:1, title:2, help:3, type:4, placeholder: 5, value: 6, aB: 8}" :value="7"/>`;
  let params = sprae(el);
  is(el.outerHTML, `<input id="0" for="1" title="2" help="3" type="4" placeholder="5" value="7" a-b="8">`);
});

test("props: sets prop", async () => {
  let el = h`<x :ref="el" :x="el.x=1" :y="el.y='abc'"></x>`;
  sprae(el);
  is(el.x, 1);
  is(el.y, "abc");
});

test("props: multiprop", async () => {
  let el = h`<input :id:name:for="0" />`;
  let params = sprae(el);
  is(el.outerHTML, `<input id="0" name="0" for="0">`);
});

test("props: calculation", async () => {
  let el = h`<x :x="a = 5, Array.from({length: x}, (_,i) => (i)).join('')"></x>`;
  let state = sprae(el, { x: 3, console, Array });
  is(el.outerHTML, `<x x="012"></x>`);
  state.x = 4;
  await tick();
  is(el.outerHTML, `<x x="0123"></x>`);
});

test.skip("props: semicols in expression", async () => {
  let el = h`<x :x="log.push(0); log.push(Array.from({length: x.value}, (_,i)=>i).join(''));"></x>`;
  let state = sprae(el, { x: signal(3), Array, log: [] });
  // is(el.outerHTML, `<x x="012"></x>`);
  is(state.log, [0, '012'])
  state.x.value = 4;
  is(state.log, [0, '012', 0, '0123'])
  // is(el.outerHTML, `<x x="0123"></x>`);
});

test("data: base", async () => {
  let el = h`<input :data="{a:1, fooBar:2}"/>`;
  let params = sprae(el);
  is(el.outerHTML, `<input data-a="1" data-foo-bar="2">`);
});

test("aria: base", async () => {
  let el = h`<input type="text" id="jokes" role="combobox" :aria="{controls:'joketypes', autocomplete:'list', expanded:false, activeOption:'item1', activedescendant:'', xxx:null}"/>`;
  sprae(el);
  is(
    el.outerHTML,
    `<input type="text" id="jokes" role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant="">`,
  );
});


test("value: direct", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: 1 });
  is(el.value, "1");
  is(el.outerHTML, `<input value="1">`);
  state.a = 2;
  await tick();
  is(el.value, "2");
  is(el.outerHTML, `<input value="2">`);

  el.value = 3;
  // el.dispatchEvent(new window.Event('change'))
  // is(state.a, '3')
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

  // el.dispatchEvent(new window.Event('change'))
  // is(state.a, '3')
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


test("text: core", async () => {
  let el = h`<div :text="text"></div>`;
  let params = sprae(el, { text: "abc" });
  is(el.outerHTML, `<div>abc</div>`);
  params.text = null;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("text: fragment", async () => {
  let el = h`a<template :text="text"/>`;
  let params = sprae(el, { text: "b" });
  is(el.outerHTML, `ab`);
  params.text = 'bc';
  await tick();
  is(el.outerHTML, `abc`);
});

test('text: fragment with condition', async () => {
  // NOTE: this ignores condition
  let el = h`a<template :text="text" :if="text!='b'"/>`;
  let params = sprae(el, { text: "b" });
  is(el.outerHTML, `ab`);
  params.text = 'c';
  await tick();
  is(el.outerHTML, `ac`);
})
test('text: condition with fragment', async () => {
  let el = h`a<template :if="text!='b'" :text="text"/>`;
  let params = sprae(el, { text: "b" });
  is(el.outerHTML, `a`);
  console.log("params.text = 'c'")
  params.text = 'c';
  await tick();
  is(el.outerHTML, `ac`);
})

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


test.skip('each: top-level list', async () => {
  let el = h`<x :each="item in items" :text="item.x"/>`
  sprae(el, { items: [{ x: 1 }] })
  is(el.outerHTML, `<x>1</x>`)
})

test('each: number', async () => {
  let el = h`<div><x :each="i, i0 in 3" :text="[i, i0]"/></div>`
  sprae(el)
  is(el.innerHTML, `<x>1,0</x><x>2,1</x><x>3,2</x>`)
})

test("each: array full", async () => {
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`;

  const params = sprae(el, { b: [0] });

  is(el.innerHTML, "<span>0</span>");

  console.log("--items[0]=1");
  params.b[0] = 1;
  await tick()
  is(el.innerHTML, "<span>1</span>");

  console.log("--items[1]=3");
  params.b[1] = 3;
  await tick();
  is(el.innerHTML, `<span>1</span><span>3</span>`);

  console.log("--items=[2,3]");
  params.b = [2, 3];
  await tick();
  is(el.innerHTML, "<span>2</span><span>3</span>");

  console.log("--items[0]=1");
  params.b[0] = 1;
  await tick()
  is(el.innerHTML, "<span>1</span><span>3</span>");

  console.log("--items.shift()");
  params.b.shift();
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("--items.length=2");
  params.b.length = 2;
  await tick();
  is(el.innerHTML, "<span>3</span><span></span>");

  console.log("--items.pop()");
  params.b.pop();
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("--items=[]");
  params.b = [];
  await tick();
  is(el.innerHTML, "");

  console.log("--items=null");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test('each: array internal signal reassign', async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`;

  let s
  const params = sprae(el, { b: signal([s = signal(0)]) });

  is(el.innerHTML, "<span>0</span>", 'signal([signal(0)])');

  console.log('---b[0].value = 1')
  params.b[0].value = 1;
  await tick()
  is(el.innerHTML, "<span>1</span>", 'b[0] = 1');

  console.log('---b=[signal(2)]')
  // params.b.value[0] = signal(2);
  // params.b.value = [...params.b.value]
  params.b = [signal(2)];
  await tick();
  is(el.innerHTML, "<span>2</span>", 'b.value = [signal(2)]');

  console.log("------b.value[0].value=3");
  params.b[0].value = 3;
  await tick()
  is(el.innerHTML, "<span>3</span>", 'b.value[0].value = 3');

})

test("each: array length ops", async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`;
  console.log('---b=[0]')
  const params = sprae(el, { b: [0] });

  await tick()
  is(el.innerHTML, "<span>0</span>");

  console.log('---b.length = 2')
  params.b.length = 2;
  await tick()
  is(el.innerHTML, "<span>0</span><span></span>");

  console.log('---b.pop()')
  params.b.pop();
  await tick()
  is(el.innerHTML, "<span>0</span>");

  console.log('---b.shift()')
  params.b.shift();
  await tick()
  is(el.innerHTML, "");

  console.log('---b.push(1,2)')
  params.b.push(1, 2);
  await tick()
  is(el.innerHTML, "<span>1</span><span>2</span>");

  console.log('---b.pop()')
  params.b.pop();
  await tick()
  is(el.innerHTML, "<span>1</span>");
});

test("each: object", async () => {
  let el = h`<p>
    <span :each="x,key in b" :text="[key,x]"></span>
  </p>`;

  const params = sprae(el, { b: null });

  is(el.innerHTML, "");
  console.log("---set 1,2");
  params.b = { x: 1, y: 2 };
  await tick();
  is(el.innerHTML, "<span>x,1</span><span>y,2</span>");
  console.log("---b = {}");
  params.b = {};
  await tick();
  is(el.innerHTML, "");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: #12 - changing internal object prop", async () => {
  let el = h`<div>
    <x :each="o in obj" :text="o"></x>
  </div>`;
  const state = sprae(el, { obj: { a: "a", b: "b" } });
  // console.log(el.outerHTML)
  is(el.outerHTML, `<div><x>a</x><x>b</x></div>`);
  console.log("-----set a");
  state.obj.a = "newvala"; // :each not working after this
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>b</x></div>`);
  console.log("-----set c");
  state.obj.c = "c";
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>b</x><x>c</x></div>`);
});

test("each: #12a - changing internal array prop", async () => {
  let el = h`<div>
    <x :each="o in arr" :text="o"></x>
  </div>`;
  const state = sprae(el, { arr: ["a", "b"] });
  // console.log(el.outerHTML)
  is(el.outerHTML, `<div><x>a</x><x>b</x></div>`);
  console.log("-----set a");
  state.arr[0] = "newvala"; // :each not working after this
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>b</x></div>`);
  state.arr[1] = "c"; // :each not working after this
  await tick()
  is(el.outerHTML, `<div><x>newvala</x><x>c</x></div>`);
});

test("each: loop within loop", async () => {
  let el = h`<p>
    <x :each="b in c"><y :each="a in b" :text="a"></y></x>
  </p>`;

  const params = sprae(el, {
    c: [
      [1, 2],
      [3, 4],
    ],
  });

  is(el.innerHTML, "<x><y>1</y><y>2</y></x><x><y>3</y><y>4</y></x>");
  params.c = [
    [5, 6],
    [3, 4],
  ];
  await tick();
  is(el.innerHTML, "<x><y>5</y><y>6</y></x><x><y>3</y><y>4</y></x>");
  // params.c[1] = [7, 8];
  params.c = [params.c[0], [7, 8]];
  await tick();
  is(el.innerHTML, "<x><y>5</y><y>6</y></x><x><y>7</y><y>8</y></x>");
  // is(el.innerHTML, '<span>1</span><span>2</span>')
  params.c = [];
  await tick();
  is(el.innerHTML, "");
  // params.b = null
  // is(el.innerHTML, '')
});

test("each: fragments single", async () => {
  await tick()
  let el = h`<p>
    <template :each="a in b"><span :text="a"/></template>
  </p>`;

  const params = sprae(el, { b: [1] });

  is(el.innerHTML, "<span>1</span>");
  await tick()
  params.b = [1, 2];
  await tick()
  is(el.innerHTML, "<span>1</span><span>2</span>");
  console.log("params.b=[]");
  params.b = [];
  await tick()
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test("each: fragments multiple", async () => {
  let el = h`<p>
    <template :each="v, i in b"><x :text="i"/><x :text="v"/></template>
  </p>`;

  const b = signal([1]);
  const params = sprae(el, { b });

  is(el.innerHTML, "<x>0</x><x>1</x>");
  b.value = [1, 2];
  await tick()
  is(el.innerHTML, "<x>0</x><x>1</x><x>1</x><x>2</x>");
  console.log("b.value=[]");
  b.value = [];
  await tick()
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test("each: fragments direct", async () => {
  let el = h`<p>
    <template :each="a in b" :text="a"></template>
  </p>`;

  const b = signal([1]);
  const params = sprae(el, { b });

  is(el.innerHTML, "1");

  console.log("b.value=[1,2]");
  b.value = [1, 2];
  is(el.innerHTML, "12");

  console.log("b.value=[]");
  b.value = [];
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test('each: fragment with condition', async () => {
  let el = h`<p>
    <template :each="a in b" :if="a!=1" :text="a"></template>
  </p>`;

  const b = signal([1, 2]);
  const params = sprae(el, { b });

  is(el.innerHTML, "2");
  b.value = [1];
  is(el.innerHTML, "");
  console.log("b.value=[]");
  b.value = [];
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test("each: loop with condition", async () => {
  let el = h`<p>
  <span :each="a in b" :if="a!=1" :text="a"></span>
  </p>`;

  const params = sprae(el, { b: [0, 1, 2] });

  is(el.innerHTML, "<span>0</span><span>2</span>");
  params.b = [2, 0, 1];
  await tick();
  is(el.innerHTML, "<span>2</span><span>0</span>");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: condition with loop", async () => {
  let el = h`<p>
  <span :if="c" :each="a in b" :text="a"></span>
  <span :else :text="c"></span>
  </p>`;

  const params = sprae(el, { b: [1, 2], c: false });

  is(el.innerHTML, "<span>false</span>");
  params.c = true;
  await tick();
  is(el.innerHTML, "<span>1</span><span>2</span>");
  params.b = [1];
  await tick();
  is(el.innerHTML, "<span>1</span>");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
  console.log("c=false");
  params.c = false;
  await tick();
  is(el.innerHTML, "<span>false</span>");
});

test("each: loop within condition", async () => {
  let el = h`<p>
    <x :if="a==1"><y :each="i in a" :text="i"></y></x>
    <x :else :if="a==2"><y :each="i in a" :text="-i"></y></x>
  </p>`;

  const params = sprae(el, { a: signal(1) });

  is(el.innerHTML, "<x><y>1</y></x>");
  params.a = 2;
  await tick();
  is(el.innerHTML, "<x><y>-1</y><y>-2</y></x>");
  params.a = 0;
  await tick();
  is(el.innerHTML, "");
});

test("each: condition within loop", async () => {
  let el = h`<p>
    <x :each="a in b">
      <if :if="a==1" :text="'1:'+a"></if>
      <elif :else :if="a==2" :text="'2:'+a"></elif>
      <else :else :text="a"></else>
    </x>
  </p>`;

  const params = sprae(el, { b: [1, 2, 3] });

  is(el.innerHTML, "<x><if>1:1</if></x><x><elif>2:2</elif></x><x><else>3</else></x>");
  params.b = [2];
  await tick();
  is(el.innerHTML, "<x><elif>2:2</elif></x>");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test('each: items refer to current el', async () => {
  // NOTE: the problem here is that the next items can subscribe to `el` defined in root state (if each hasn't created scope), that will cause unnecessary :x effect
  let el = h`<div><x :each="x in 3" :data-x="x" :ref="el" :x="log.push(x, el.dataset.x)"></x></div>`;
  let log = signal([]);
  let state = sprae(el, { log, untracked });
  is([...state.log], [1, "1", 2, "2", 3, "3"]);
});

test("each: unkeyed", async () => {
  let el = h`<div><x :each="x, i in xs" :text="x"></x></div>`;
  let state = sprae(el, { xs: signal([1, 2, 3]) });
  is(el.children.length, 3);
  is(el.textContent, "123");
  // let first = el.firstChild
  state.xs = [1, 3, 2];
  await tick();
  // is(el.firstChild, first)
  is(el.textContent, "132");
  console.log('-------- set 333')
  state.xs = [3, 3, 3];
  await tick();
  is(el.textContent, "333");
  // is(el.firstChild, first)
});

test("each: expression as source", async () => {
  let el = h`<div><x :each="i in (x || 2)" :text="i"></x></div>`;
  sprae(el, { x: 0 });
  is(el.innerHTML, `<x>1</x><x>2</x>`);
});

test.skip("each: unmounted elements remove listeners", async () => {
  // let's hope they get removed without memory leaks :')
});

test("each: internal children get updated by state update, also: update by running again", async () => {
  let el = h`<><x :each="item, idx in items" :text="item" :key="idx"></x></>`;
  let state = sprae(el, { items: signal([1, 2, 3]) });
  is(el.textContent, "123");
  console.log('----items=[2,2,3]')
  state.items = [2, 2, 3];
  await tick();
  is(el.textContent, "223");
  console.log("items = [0, 2, 3]");
  state.items = [0, 2, 3];
  // state = sprae(el, { items: [0, 2, 3] });
  await tick();
  is(el.textContent, "023");
  // NOTE: this doesn't update items, since they're new array
  console.log("-----state.items[0] = 1");
  state.items[0] = 1;
  state.items = [...state.items];
  await tick();
  is(el.textContent, "123");
});

test("each: :id and others must receive value from context", () => {
  let el = h`<div><x :each="item, idx in items" :id="idx"></x></div>`;
  sprae(el, { items: [1, 2, 3] });
  is(el.innerHTML, `<x id="0"></x><x id="1"></x><x id="2"></x>`);
});

test("each: remove last", async () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.findIndex((x) => x.id == item.id);
      this.rows.splice(index, 1);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  console.log("---Remove id 5");
  s.remove({ id: 5 });
  await tick()
  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr></table>`);
});

test("each: remove first", async () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.findIndex((x) => x.id == item.id);
      this.rows.splice(index, 1);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  console.log("Remove id 1");
  s.remove({ id: 1 });
  await tick()
  is(el.outerHTML, `<table><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
});

test("each: swapping", async () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>`;

  const rows = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  let s = sprae(el, {
    rows,
    swap() {
      const a = this.rows[1];
      console.log(`[1]=[4]`);
      this.rows[1] = this.rows[this.rows.length - 2];
      console.log(`[4]=[1]`);
      this.rows[this.rows.length - 2] = a;
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  s.swap();
  await tick();
  is(el.outerHTML, `<table><tr>1</tr><tr>4</tr><tr>3</tr><tr>2</tr><tr>5</tr></table>`);
});

test("each: with :with", () => {
  let el = h`<ul><li :each="i in 3" :with="{x:i}" :text="x"></li></ul>`;
  sprae(el);
  is(el.outerHTML, `<ul><li>1</li><li>2</li><li>3</li></ul>`);
});

test("each: subscribe to modifying list", async () => {
  let el = h`<ul>
    <li :each="item in rows" :text="item" :onremove="e=>remove(item)">
    </li>
  </ul>`;
  const state = sprae(el, {
    rows: [1],
    remove() {
      this.rows = [];
    },
  });
  is(el.outerHTML, `<ul><li>1</li></ul>`);
  // state.remove()
  el.querySelector("li").dispatchEvent(new window.Event("remove"));
  console.log("---removed", state.rows);

  await tick();
  is(el.outerHTML, `<ul></ul>`);
});

test('each: unwanted extra subscription', async t => {
  let el = h`<div><x :each="item,i in (console.log('upd',_count),_count++, rows)"><a :text="item.label"></a></x></div>`

  const rows = signal(null)
  const state = sprae(el, { rows, _count: 0 })

  console.log('------rows.value = [{id:0},{id:1}]')
  await tick()
  is(state._count, 1)

  let a = { label: signal(0) }, b = { label: signal(0) }
  rows.value = [a, b]
  await tick()
  is(state._count, 2)

  console.log('--------rows.value[1].label.value += 2')
  b.label.value += 2
  is(state._count, 2)
  is(el.innerHTML, `<x><a>0</a></x><x><a>2</a></x>`)

  console.log('---------rows.value=[rows.value[0]]')
  // this thingy subscribes full list to update
  rows.value = [b]
  await tick()
  is(state._count, 3)
  is(el.innerHTML, `<x><a>2</a></x>`)

  console.log('--------rows.value[0].label += 2')
  b.label.value += 2
  await tick()
  is(state._count, 3)
  is(el.innerHTML, `<x><a>4</a></x>`)
});

test('each: batched .length updates', async t => {
  let c = 0
  let state = store({ list: [1, 2], count() { c++ } })
  let el = h`<a><b :each="x in (count(), list)" :text="x"/></a>`
  sprae(el, state)
  await tick()
  is(c, 1)
  is(el.innerHTML, `<b>1</b><b>2</b>`)

  state.list.push(3, 4, 5)
  // bump list
  batch(() => {
    let list = state.list
    state.list = null
    state.list = list
  })
  await tick()
  is(c, 2)
})

test('each: rewrite item', async t => {
  let el = h`<a><x :each="i in items" :text="i" :onx="e=>i++"/></a>`
  let state = sprae(el, { items: [1, 2, 3] })
  is(el.innerHTML, `<x>1</x><x>2</x><x>3</x>`)
  el.childNodes[1].dispatchEvent(new window.Event("x"))
  is(el.innerHTML, `<x>1</x><x>3</x><x>3</x>`)
})

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
  let a = h`<div><x :text="x"></x><x :with={x:2} :text="x"></x><x :text="y">3</x></div>`;
  sprae(a, { x: 1, y: 3 });
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});

test("with: scope directives must come first", async () => {
  // NOTE: we init attributes in order of definition
  let a = h`<x :with="{y:1}" :text="y" :ref="x"></x>`;
  sprae(a, {});
  is(a.outerHTML, `<x>1</x>`);
});


test("html: by ref", async () => {
  let a = h`<template :ref="abc"><div :text="123"></div></template><x :html="abc">456</x>`;
  sprae(a);
  is(a.outerHTML, `<template><div :text="123"></div></template><x><div>123</div></x>`);
});

test("html: state", async () => {
  let a = h`<template :ref="abc"><div :text="text"></div></template><x :html="abc" />`;
  let state = sprae(a, { text: "abc" });
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`);
  state.text = "def";
  await tick();
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>def</div></x>`);
});

test("html: :with", async () => {
  let a = h`<template :ref="tpl"><div :text="text"></div></template><x :html="tpl" :with="{text:'abc'}" />`;
  let state = sprae(a);
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`);
});

test("html: nested items", async () => {
  let el = h`<template :ref="tpl"><div :each="item in items" :text="item.id"></div></template><x :html="tpl" :with="{items:[{id:'a'},{id:'b'}]}" />`;
  let state = sprae(el);
  is(
    el.outerHTML,
    `<template><div :each="item in items" :text="item.id"></div></template><x><div>a</div><div>b</div></x>`,
  );
});

test.skip("html: template after use", async () => {
  let a = h`<x :html="tpl" :with="{text:'abc'}" /><template :ref="tpl"><div :text="text"></div></template>`;
  let state = sprae(a);
  is(a.outerHTML, `<x><div>abc</div></x><template><div :text="text"></div></template>`);
});


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


test(":: reactive values", async () => {
  let a = signal();
  setTimeout(() => (a.value = 2), 10);

  let el = h`<x :text="a">1</x>`;
  sprae(el, { a });
  is(el.outerHTML, `<x></x>`);

  await time(20);
  is(el.outerHTML, `<x>2</x>`);
});

test(":: null result does nothing", async () => {
  let a = h`<x :="undefined"></x>`;
  sprae(a);
  is(a.outerHTML, `<x></x>`);
});

test("fx: effects", async () => {
  let el = h`<x :fx="(log.push(x), () => (log.push('out')))"></x>`;
  let x = signal(1)
  let state = sprae(el, { log: [], x, console });
  is(el.outerHTML, `<x></x>`);
  is(state.log, [1])
  console.log('upd value')
  x.value = 2
  await tick()
  is(el.outerHTML, `<x></x>`);
  is(state.log, [1, 'out', 2])
  el[Symbol.dispose]()
  is(state.log, [1, 'out', 2, 'out'])
});

test.skip("immediate scope", async () => {
  let el = h`<x :with="{arr:[], inc(){ arr.push(1) }}" :onx="e=>inc()" :text="arr[0]"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.outerHTML, `<x>1</x>`);
});

test("getters", async () => {
  let x = h`<h2 :text="doubledCount >= 1 ? 1 : 0"></h2>`;
  let state = sprae(x, {
    count: signal(0),
    get doubledCount() {
      return this.count * 2;
    },
  });
  is(x.outerHTML, `<h2>0</h2>`);
  state.count++;
  await tick();
  is(x.outerHTML, `<h2>1</h2>`);
});

test("subscribe to array length", async () => {
  // pre-heat can cause error
  sprae(h`<x :fx="(log.push(1))"></x>`, { log: [] });

  console.log('---create')
  let el = h`<div :with="{likes:[]}"><x :onx="e=>(likes.push(1))"></x><y :text="console.log('text'),likes.length"></y></div>`;
  sprae(el);
  is(el.innerHTML, `<x></x><y>0</y>`);
  console.log('---event')
  el.firstChild.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.innerHTML, `<x></x><y>1</y>`);
});

test("csp: sandbox", async () => {
  const { default: justin } = await import('subscript/justin')
  sprae.use({ compile: justin })
  const globals = { console };
  const state = Object.assign(Object.create(globals), { log: [] });

  // let el = h`<x :x="log.push(1)"></x>`
  let el = h`<x :x="console.group('set'),log.push( self,  console,  arguments,  __scope),console.groupEnd()"></x>`;
  let s = sprae(el.cloneNode(), state);
  is(s.log, [undefined, console, undefined, undefined]);
  // s.log.splice(0);
  // s.log = [];
  Object.assign(globals, { self: window });
  console.log("--------- sprae again with globals");
  s = sprae(el.cloneNode(), state);
  console.log(s.log)
  is(s.log, [window, console, undefined, undefined]);
});

test("switch signals", async () => {
  const preact = await import('@preact/signals-core')
  sprae.use(preact)

  let el = h`<div :text="x"/>`
  let state = sprae(el, { x: preact.signal(1) })
  is(el.innerHTML, '1')
  state.x = 2
  is(el.innerHTML, '2')
})


test.skip("events: async", async (e) => {
  let el = h`<div :onx="e => {await v = 1; log.push(v);}"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, []);
  await tick(1);
  is(state.log, [1]);

  let el2 = h`<div :onx="e => {1; log.push(1);}"></div>`;
  let state2 = sprae(el2, { log: [] });
  el2.dispatchEvent(new window.Event("x"));
  is(state2.log, []);
  await tick(1);
  is(state2.log, [1]);
});

test("events: t̵h̵i̵s̵ ̵c̵o̵n̵t̵e̵x̵t̵ event target", (e) => {
  // NOTE: we disregard this context, since we can obtain it from event target
  let el = h`<div :onx="event => log.push(event.target)"></div>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.Event("x"));
  is(state.log, [el]);
});

test("events: multiple events", (e) => {
  let el = h`<div :onscroll:onclick:onx="event=>log.push(event.type)"></div>`;
  let state = sprae(el, { log: [] });

  el.dispatchEvent(new window.Event("click"));
  is(state.log, ["click"]);
  el.dispatchEvent(new window.Event("scroll"));
  is(state.log, ["click", "scroll"]);
  el.dispatchEvent(new window.Event("x"));
  is(state.log, ["click", "scroll", "x"]);
});

test("events: once", (e) => {
  let el = h`<x :onx.once="e => (x && log.push(x))" ></x>`;
  let s = sprae(el, { log: [], x: 1 });
  el.dispatchEvent(new window.Event("x"));
  is(s.log, [1]);
  el.dispatchEvent(new window.Event("x"));
  is(s.log, [1]);
  // should not react on changes signals from outside
  console.log("--- x=2");
  s.x = 2;
  el.dispatchEvent(new window.Event("x"));
  el.dispatchEvent(new window.Event("x"));
  is(s.log, [1]);
});

test("events: capture, stop, prevent", (e) => {
  let el = h`<x :onx.capture="e => log.push(1)"><y :onx="e => log.push(2)"></y></x>`;
  let state = sprae(el, { log: [] });
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 2]);

  let el2 = h`<x :onx="e => log.push(1)"><y :onx.stop="e => log.push(2)"></y></x>`;
  let state2 = sprae(el2, { log: [] });
  el2.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state2.log, [2]);
});

test("events: window, self", (e) => {
  let el = h`<x :onx.self="e => log.push(1)"><y :onx.window="e => log.push(2)"></y></x>`;
  let state = sprae(el, { log: [] });
  el.firstChild.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, []);
  el.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1]);
  window.dispatchEvent(new window.Event("x", { bubbles: true }));
  is(state.log, [1, 2]);
});

test("events: keys", (e) => {
  let el = h`<x :onkeydown.enter="e => log.push(1)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, [1]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  is(state.log, [1, 1]);
});

test("events: key combinations", (e) => {
  let el = h`<x :onkeydown.ctrl-enter="e => log.push(1)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "" }));
  is(state.log, []);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  is(state.log, [1]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter" }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", ctrlKey: true }));
  is(state.log, [1, 1]);
  let el2 = h`<x :onkeydown.ctrl-alt-enter="e=>log.push(1)"></x>`;
});

test("events: keys with prevent", (e) => {
  let el = h`<y :onkeydown="event => log.push(event.key)"><x :ref="x" :onkeydown.enter.stop></x></y>`;
  let state = sprae(el, { log: [] });
  console.log(state)
  state.x.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  console.log("enter");
  state.x.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  is(state.log, ["x"]);
});

test("events: debounce", async (e) => {
  let el = h`<x :onkeydown.debounce-1="event => log.push(event.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, []);
  await time(2);
  is(state.log, ["x"]);
});

test("events: debounce 0", async (e) => {
  let el = h`<x :onkeydown.debounce-0="e => log.push(e.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, []);
  await time(2);
  is(state.log, ["x"]);
});

test("events: throttle", async (e) => {
  let el = h`<x :onkeydown.throttle-10="event => log.push(event.key)"></x>`;
  let state = sprae(el, { log: [] });
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, ["x"]);
  await time(5);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, ["x"]);
  await time(10);
  is(state.log, ["x", "x"]);
  await time(10);
  is(state.log, ["x", "x"]);
  el.dispatchEvent(new window.KeyboardEvent("keydown", { key: "x", bubbles: true }));
  is(state.log, ["x", "x", "x"]);
});

test('events: in-out events', e => {
  let el = h`<x :onmousedown..onmouseup="(e) => (x=e.target; log.push(e.type); e=>log.push(e.type))"></x>`

  let state = sprae(el, { log: [], x: null })
  el.dispatchEvent(new window.Event('mousedown'));
  is(state.x, el);
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mouseup'])
})

test('events: toggle', async e => {
  let el = h`<x :onx..onx="e=>(log.push(1),e=>log.push(2))"></x>`
  let state = sprae(el, { log: [] })
  console.log('dispatch')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1])
  console.log('dispatch')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2])
  console.log('dispatch')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2, 1])
  console.log('dispatch')
  el.dispatchEvent(new window.KeyboardEvent('x'));
  is(state.log, [1, 2, 1, 2])
})

test('events: chain of events', e => {
  let el = h`<div :onmousedown..onmousemove..onmouseup="e=>(log.push(e.type),e=>(log.push(e.type),e=>log.push(e.type)))"></div>`
  let state = sprae(el, { log: [] })

  el.dispatchEvent(new window.Event('mousedown'));
  is(state.log, ['mousedown'])
  el.dispatchEvent(new window.Event('mousemove'));
  is(state.log, ['mousedown', 'mousemove'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mousemove', 'mouseup'])
  el.dispatchEvent(new window.Event('mouseup'));
  is(state.log, ['mousedown', 'mousemove', 'mouseup'])
  el.dispatchEvent(new window.Event('mousedown'));
  is(state.log, ['mousedown', 'mousemove', 'mouseup', 'mousedown'])
})

test('events: parallel chains', e => {
  let log = []

  // 1. skip in event and do directly out
  let el = h`<x :onin.1.stop.immediate..onout.stop.immediate="io" :onin.2.stop.immediate..onout.stop.immediate="io"></x>`
  sprae(el, {
    io(e) {
      log.push(e.type)
      return (e) => (log.push(e.type), [1, 2, 3])
    }
  })

  el.dispatchEvent(new window.Event('out'));
  is(log, [])

  // 2. Some nonsensical return is fine
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out'], 'out triggers right')
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out'])
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in', 'out', 'in'])
  el.dispatchEvent(new window.Event('in'));
  is(log, ['in', 'out', 'in', 'in'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out', 'in', 'in', 'out'])
  el.dispatchEvent(new window.Event('out'));
  is(log, ['in', 'out', 'in', 'in', 'out', 'out'])
})

test.skip('events: parallel chains', e => {
  // NOTE: covered above
  let el = h`<div :onx..ony..onz="e=>('x',log.push(e.type),e=>('y',log.push(e.type),e=>('z',log.push(e.type))))"></div>`
  let state = sprae(el, { log: [] })

  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x'])
  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x', 'x'])
  console.log('emit y')
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x', 'x', 'y', 'y'])
  console.log('emit y')
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x', 'x', 'y', 'y'])
  console.log('emit z')
  el.dispatchEvent(new window.Event('z'));
  console.log('emit y')
  el.dispatchEvent(new window.Event('y'));
  is(state.log, ['x', 'x', 'y', 'y', 'z', 'z'])
  el.dispatchEvent(new window.Event('z'));
  is(state.log, ['x', 'x', 'y', 'y', 'z', 'z']);
  el.dispatchEvent(new window.Event('x'));
  is(state.log, ['x', 'x', 'y', 'y', 'z', 'z', 'x']);
})

test('events: state changes between chain of events', async e => {
  let el = h`<x :onx..ony="fn"></x>`
  let log = []
  let state = sprae(el, { log, fn: () => (log.push('x1'), () => log.push('y1')) })
  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1'])
  console.log('update fn')
  state.fn = () => (log.push('x2'), () => log.push('y2'))
  await tick()
  is(log, ['x1'])
  // console.log('xx')
  // NOTE: state update registers new chain listener before finishing prev chain
  el.dispatchEvent(new window.Event('x'));
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1'])
  console.log('emit y, y')
  el.dispatchEvent(new window.Event('y'));
  el.dispatchEvent(new window.Event('y'));
  is(log, ['x1', 'y1'])
  console.log('emit x')
  el.dispatchEvent(new window.Event('x'));
  is(log, ['x1', 'y1', 'x2'])
  console.log('emit y, y')
  el.dispatchEvent(new window.Event('y'));
  el.dispatchEvent(new window.Event('y'));
  is(log, ['x1', 'y1', 'x2', 'y2'])
})

test('events: modifiers chain', async e => {
  let el = h`<x :onkeydown.letter..onkeyup.letter="e=>(log.push(e.key),(e)=>log.push(e.key))"></x>`
  let state = sprae(el, { log: [] })
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'x', bubbles: true }));
  el.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  is(state.log, ['x'])
  el.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  is(state.log, ['x'])
  el.dispatchEvent(new window.KeyboardEvent('keyup', { key: 'x', bubbles: true }));
  is(state.log, ['x', 'x'])
})

test.skip('memory allocation', async e => {
  let items = signal([])
  let el = h`<><x :each="item in items" :text="item.x"></x></>`
  let btn = document.createElement('button')
  document.body.appendChild(btn)
  btn.textContent = 'Allocate'
  btn.onclick = e => {
    let newItems = []
    for (let i = 0; i < 10000; i++) {
      let item = { x: i }
      newItems.push(item)
    }
    items.value = newItems
  }
  sprae(el, { items });
})

test.todo('perf: must be fast', async e => {
  let el = h`<a :l="l"><b :each="i in l"><c :text="i"/></b></a>`
  console.time('perf')
  for (let i = 0; i < 1e2; i++) {
    sprae(el.cloneNode(true), { l: 1e2 })
  }
  console.timeEnd('perf')
})
