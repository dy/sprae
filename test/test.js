// import { signal } from 'usignal/sync'
import test, { is, any, throws } from "tst";
import { tick, time } from "wait-please";
import sprae from '../sprae.js'
import { signal, effect, untracked, batch, computed } from "../src/signal.js";
import h from "hyperf";

Object.defineProperty(DocumentFragment.prototype, "outerHTML", {
  get() {
    let s = "";
    this.childNodes.forEach((n) => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : "";
    });
    return s;
  },
});
// bump signal value (trigger update without updating)
const bump = (s) => batch((_) => ((_ = s.value), (s.value = null), (s.value = _)));

test("hidden: core", async () => {
  let el = h`<div :hidden="hidden"></div>`;
  let params = sprae(el, { hidden: signal(true) });
  is(el.outerHTML, `<div hidden=""></div>`);
  params.hidden.value = false;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("hidden: reactive", async () => {
  const hidden = signal(true);
  let el = h`<div :hidden="hidden"></div>`;
  sprae(el, { hidden });
  is(el.outerHTML, `<div hidden=""></div>`);
  hidden.value = false;
  is(el.outerHTML, `<div></div>`);
});

test("common: reactive", async () => {
  let el = h`<label :for="name" :text="name" ></label><input :id="name" :name="name" :type="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`;
  let params = sprae(el, { name: signal("text"), url: "//google.com" });
  is(
    el.outerHTML,
    `<label for="text">text</label><input id="text" name="text" type="text"><a href="//google.com"></a><img src="//google.com">`,
  );
  params.name.value = "email";
  await tick();
  is(
    el.outerHTML,
    `<label for="email">email</label><input id="email" name="email" type="email"><a href="//google.com"></a><img src="//google.com">`,
  );
});

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

test.todo("common: const in with", async () => {
  let el = h`<div :scope="{x(){let x = 1; y=x;}}" @x="x()"></div>`;
  let state = sprae(el, { y: 0 });
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(state.y, 1);
});

test("style", async () => {
  let el = h`<x style="left: 1px" :style="style"></x>`;
  let params = sprae(el, { style: signal("top: 1px") });
  is(el.outerHTML, `<x style="left: 1px; top: 1px"></x>`);

  params.style.value = { top: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);

  params.style.value = { "--x": 123 };
  await tick();
  is(el.style.getPropertyValue("--x"), "123");

  params.style.value = { top: "1px", bottom: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 1px; bottom: 2px;"></x>`);

  params.style.value = { top: "2px", bottom: null };
  // FIXME
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);
});

test("class", async () => {
  let el = h`<x class="base" :class="a"></x><y :class="[b, c]"></y><z :class="['b', d.value && 'c']"></z>`;
  const c = signal("z");
  let params = sprae(el, { a: "x", b: "y", c, d: signal(false) });
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z class="b"></z>`);
  params.d.value = true;
  await tick();
  is(el.outerHTML, `<x class="base x"></x><y class="y z"></y><z class="b c"></z>`);
  // c.value = 'w'
  // is(el.outerHTML, `<x class="base x"></x><y class="y w"></y><z class="b c"></z>`);
});

test("class: undefined value", async () => {
  let el = h`<x :class="a"></x><y :class="[b]"></y><z :class="{c}"></z>`;
  sprae(el, { a: undefined, b: undefined, c: undefined });
  is(el.outerHTML, `<x></x><y></y><z></z>`);
});

test("class: old svg fun", async () => {
  // raw html creates svganimatedstring
  let el = document.createElement("div");
  el.innerHTML = `<svg class="foo" :class="a.value ? 'x' : 'y'"></svg>`;

  let s = sprae(el, { a: signal(true) });
  is(el.innerHTML, `<svg class="foo x"></svg>`);
  s.a.value = false;
  await tick();
  is(el.innerHTML, `<svg class="foo y"></svg>`);
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
  let state = sprae(el, { x: signal(3), console, Array });
  is(el.outerHTML, `<x x="012"></x>`);
  state.x.value = 4;
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

test.skip("data: base", async () => {
  let el = h`<input :data="{a:1, fooBar:2}"/>`;
  let params = sprae(el);
  is(el.outerHTML, `<input data-a="1" data-foo-bar="2">`);
});

test.skip("aria: base", async () => {
  let el = h`<input type="text" id="jokes" role="combobox" :aria="{controls:'joketypes', autocomplete:'list', expanded:false, activeOption:'item1', activedescendant:'', xxx:null}"/>`;
  sprae(el);
  is(
    el.outerHTML,
    `<input type="text" id="jokes" role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant="">`,
  );
});

test("value: direct", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: signal(1) });
  is(el.value, "1");
  is(el.outerHTML, `<input value="1">`);
  state.a.value = 2;
  await tick();
  is(el.value, "2");
  is(el.outerHTML, `<input value="2">`);

  el.value = 3;
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
  let params = sprae(el, { text: signal("abc") });
  is(el.outerHTML, `<div>abc</div>`);
  params.text.value = null;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("text: fragment", async () => {
  let el = h`a<template :text="text"/>`;
  let params = sprae(el, { text: signal("b") });
  is(el.outerHTML, `ab`);
  params.text.value = 'bc';
  await tick();
  is(el.outerHTML, `abc`);
});

test("if: base", async () => {
  let el = h`<p>
    <span :if="a==1">a</span>
    <span :else :if="a==2">b</span>
    <span :else >c</span>
  </p>`;

  const params = sprae(el, { a: signal(1) });

  is(el.innerHTML, "<span>a</span>");
  params.a.value = 2;
  await tick();
  is(el.innerHTML, "<span>b</span>");
  params.a.value = 3;
  await tick();
  is(el.innerHTML, "<span>c</span>");
  params.a.value = null;
  await tick();
  is(el.innerHTML, "<span>c</span>");
});

test("if: template", async () => {
  let el = h`<p>
    <template :if="a==1">a<x>1</x></template>
    <template :else :if="a==2">b<x>2</x></template>
    <template :else >c<x>3</x></template>
  </p>`;

  const params = sprae(el, { a: signal(1) });

  is(el.innerHTML, "a<x>1</x>");
  params.a.value = 2;
  await tick();
  is(el.innerHTML, "b<x>2</x>");
  params.a.value = 3;
  await tick();
  is(el.innerHTML, "c<x>3</x>");
  params.a.value = null;
  await tick();
  is(el.innerHTML, "c<x>3</x>");
});


test("if: short with insertions", async () => {
  let el = h`<p>
    <span :if="a==1" :text="'1:'+a"></span>
    <span :else :if="a==2" :text="'2:'+a"></span>
    <span :else :text="a"></span>
  </p>`;

  const params = sprae(el, { a: signal(1) });

  is(el.innerHTML, "<span>1:1</span>");
  params.a.value = 2;
  await tick();
  is(el.innerHTML, "<span>2:2</span>");
  params.a.value = 3;
  await tick();
  is(el.innerHTML, "<span>3</span>");
  params.a.value = 4;
  await tick();
  is(el.innerHTML, "<span>4</span>");

  params.a.value = 1;
  await tick();
  is(el.innerHTML, "<span>1:1</span>");
  params.a.value = 4;
  await tick();
  is(el.innerHTML, "<span>4</span>");

  params.a.value = null;
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
  is(el.innerHTML, "<span>2:2</span>");
  a.value = 3;
  is(el.innerHTML, "<span>3</span>");
  a.value = 4;
  is(el.innerHTML, "<span>4</span>");

  a.value = 1;
  is(el.innerHTML, "<span>1:1</span>");
  a.value = 4;
  is(el.innerHTML, "<span>4</span>");
});

test("if: (#3) subsequent content is not abandoned", async () => {
  let x = h`<x><y :if="!!y"></y><z :text="123"></z></x>`;
  sprae(x, { y: false });
  is(x.outerHTML, `<x><z>123</z></x>`);
});

test("if: + :scope doesnt prevent secondary effects from happening", async () => {
  let el = h`<div><x :if="x" :scope="{}" :text="x"></x></div>`;
  let state = sprae(el, { x: signal("") });
  is(el.innerHTML, ``);
  console.log("state.x=123");
  state.x.value = "123";
  await tick();
  is(el.innerHTML, `<x>123</x>`);

  // NOTE: we ignore this case
  // let el2 = h`<div><x :if="x" :scope="{x:cond}" :text="x"></x></div>`
  // let state2 = sprae(el, {cond:''})
  // is(el2.innerHTML, ``)
  // state2.cond = '123'
  // is(el2.innerHTML, `<x>123</x>`)
});

test("each: array full", async () => {
  let el = h`<p>
    <span :each="a in b" :text="a"></span>
  </p>`;

  const params = sprae(el, { b: signal([signal(0)]) });

  is(el.innerHTML, "<span>0</span>");

  console.log("items[0]=1");
  params.b.value[0].value = 1;
  is(el.innerHTML, "<span>1</span>");

  console.log("items[1]=3");
  params.b.value[1] = signal(3);
  bump(params.b);
  await tick();
  is(el.innerHTML, `<span>1</span><span>3</span>`);

  console.log("items=[2,3]");
  params.b.value = [signal(2), 3];
  await tick();
  is(el.innerHTML, "<span>2</span><span>3</span>");

  console.log("items[0]=1");
  params.b.value[0].value = 1;
  is(el.innerHTML, "<span>1</span><span>3</span>");

  console.log("items.shift()");
  params.b.value.shift();
  bump(params.b);
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("items.length=2");
  params.b.value.length = 2;
  bump(params.b);
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("items.pop()");
  params.b.value.pop();
  bump(params.b);
  await tick();
  is(el.innerHTML, "<span>3</span>");

  console.log("items=[]");
  params.b.value = [];
  bump(params.b);
  await tick();
  is(el.innerHTML, "");

  console.log("items=null");
  params.b = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: array length ops", async () => {
  let el = h`<p><span :each="a in b" :text="a"></span></p>`;
  const params = sprae(el, { b: signal([0]) });

  is(el.innerHTML, "<span>0</span>");
  params.b.value.length = 2;
  bump(params.b);
  is(el.innerHTML, "<span>0</span>");
  params.b.value.pop();
  bump(params.b);
  is(el.innerHTML, "<span>0</span>");

  params.b.value.shift();
  bump(params.b);
  is(el.innerHTML, "");
  params.b.value.push(1, 2);
  bump(params.b);
  is(el.innerHTML, "<span>1</span><span>2</span>");
  params.b.value.pop();
  bump(params.b);
  is(el.innerHTML, "<span>1</span>");
});

test("each: object", async () => {
  let el = h`<p>
    <span :each="x,key in b" :text="[key,x]"></span>
  </p>`;

  const params = sprae(el, { b: signal(null) });

  is(el.innerHTML, "");
  console.log("---set 1,2");
  params.b.value = { x: 1, y: 2 };
  await tick();
  is(el.innerHTML, "<span>x,1</span><span>y,2</span>");
  console.log("---b = {}");
  params.b.value = {};
  await tick();
  is(el.innerHTML, "");
  params.b.value = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: #12 - changing internal object prop", async () => {
  let el = h`<div>
    <x :each="o in obj" :text="o"></x>
  </div>`;
  const state = sprae(el, { obj: signal({ a: "a", b: "b" }) });
  // console.log(el.outerHTML)
  is(el.outerHTML, `<div><x>a</x><x>b</x></div>`);
  console.log("-----set a");
  state.obj.value.a = "newvala"; // :each not working after this
  bump(state.obj);
  is(el.outerHTML, `<div><x>newvala</x><x>b</x></div>`);
  state.obj.value.c = "c";
  bump(state.obj);
  is(el.outerHTML, `<div><x>newvala</x><x>b</x><x>c</x></div>`);
});

test("each: #12a - changing internal array prop", async () => {
  let el = h`<div>
    <x :each="o in arr" :text="o"></x>
  </div>`;
  const state = sprae(el, { arr: [signal("a"), signal("b")] });
  // console.log(el.outerHTML)
  is(el.outerHTML, `<div><x>a</x><x>b</x></div>`);
  console.log("-----set a");
  state.arr[0].value = "newvala"; // :each not working after this
  is(el.outerHTML, `<div><x>newvala</x><x>b</x></div>`);
  state.arr[1].value = "c"; // :each not working after this
  is(el.outerHTML, `<div><x>newvala</x><x>c</x></div>`);
});

test("each: loop within loop", async () => {
  let el = h`<p>
    <x :each="b in c"><y :each="a in b" :text="a"></y></x>
  </p>`;

  const params = sprae(el, {
    c: signal([
      [1, 2],
      [3, 4],
    ]),
  });

  is(el.innerHTML, "<x><y>1</y><y>2</y></x><x><y>3</y><y>4</y></x>");
  params.c.value = [
    [5, 6],
    [3, 4],
  ];
  bump(params.c);
  await tick();
  is(el.innerHTML, "<x><y>5</y><y>6</y></x><x><y>3</y><y>4</y></x>");
  // params.c.value[1] = [7, 8];
  params.c.value = [params.c.value[0], [7, 8]];
  bump(params.c);
  await tick();
  is(el.innerHTML, "<x><y>5</y><y>6</y></x><x><y>7</y><y>8</y></x>");
  // is(el.innerHTML, '<span>1</span><span>2</span>')
  params.c.value = [];
  bump(params.c);
  await tick();
  is(el.innerHTML, "");
  // params.b = null
  // is(el.innerHTML, '')
});

test("each: fragments single", async () => {
  let el = h`<p>
    <template :each="a in b"><span :text="a"/></template>
  </p>`;

  const b = signal([1]);
  const params = sprae(el, { b });

  is(el.innerHTML, "<span>1</span>");
  b.value = [1, 2];
  is(el.innerHTML, "<span>1</span><span>2</span>");
  console.log("b.value=[]");
  b.value = [];
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
  is(el.innerHTML, "<x>0</x><x>1</x><x>1</x><x>2</x>");
  console.log("b.value=[]");
  b.value = [];
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});

test.skip("each: fragments text", async () => {
  let el = h`<p>
    <template :each="a in b" :text="a"></template>
  </p>`;

  const b = signal([1]);
  const params = sprae(el, { b });

  is(el.innerHTML, "<span>1</span>");
  b.value = [1, 2];
  is(el.innerHTML, "<span>1</span><span>2</span>");
  console.log("b.value=[]");
  b.value = [];
  is(el.innerHTML, "");
  params.b = null;
  is(el.innerHTML, "");
});


test("each: loop with condition", async () => {
  // NOTE: there doesn't seem to be much value in exactly that
  // also it creates confusion with :else directive
  // prohibiting that allows in-order directives init
  let el = h`<p>
  <span :if="c" :each="a in b" :text="a"></span>
  </p>`;

  const params = sprae(el, { b: signal([1, 2]), c: signal(false) });

  is(el.innerHTML, "");
  params.c.value = true;
  await tick();
  is(el.innerHTML, "<span>1</span><span>2</span>");
  params.b.value = [1];
  await tick();
  is(el.innerHTML, "<span>1</span>");
  console.log("set null");
  params.b.value = null;
  await tick();
  is(el.innerHTML, "");
});

test("each: condition with loop", async () => {
  let el = h`<p>
  <span :if="c" :each="a in b" :text="a"></span>
  <span :else :text="c"></span>
  </p>`;

  const params = sprae(el, { b: signal([1, 2]), c: signal(false) });

  is(el.innerHTML, "<span>false</span>");
  params.c.value = true;
  await tick();
  is(el.innerHTML, "<span>1</span><span>2</span>");
  params.b.value = [1];
  await tick();
  is(el.innerHTML, "<span>1</span>");
  params.b.value = null;
  await tick();
  is(el.innerHTML, "");
  console.log("c=false");
  params.c.value = false;
  await tick();
  is(el.innerHTML, "<span>false</span>");
});

test("each: loop within condition", async () => {
  let el = h`<p>
    <x :if="a==1"><y :each="i in a" :text="i"></y></x>
    <x :else :if="a==2"><y :each="i in a" :text="-i"></y></x>
  </p>`;

  const params = sprae(el, { a: signal(1) });

  is(el.innerHTML, "<x><y>0</y></x>");
  params.a.value = 2;
  await tick();
  is(el.innerHTML, "<x><y>0</y><y>-1</y></x>");
  params.a.value = 0;
  await tick();
  is(el.innerHTML, "");
});

test("each: condition within loop", async () => {
  let el = h`<p>
    <x :each="a in b">
      <y :if="a==1" :text="'1:'+a"></y>
      <y :else :if="a==2" :text="'2:'+a"></y>
      <y :else :text="a"></y>
    </x>
  </p>`;

  const params = sprae(el, { b: signal([1, 2, 3]) });

  is(el.innerHTML, "<x><y>1:1</y></x><x><y>2:2</y></x><x><y>3</y></x>");
  params.b.value = [2];
  await tick();
  is(el.innerHTML, "<x><y>2:2</y></x>");
  params.b.value = null;
  await tick();
  is(el.innerHTML, "");
});

test('each: next items have own "this", not single one', async () => {
  // FIXME: fragment init like let el = h`<x :each="x in 3"></x>`
  let el = h`<div><x :each="x in 3" :data-x="x" :ref="el" :x="log.push(x, el.dataset.x)"></x></div>`;
  let log = [];
  let state = sprae(el, { log });
  is(state.log, [0, "0", 1, "1", 2, "2"]);
});

test("each: unkeyed", async () => {
  let el = h`<div><x :each="x in xs" :text="x"></x></div>`;
  let state = sprae(el, { xs: signal([1, 2, 3]) });
  is(el.children.length, 3);
  is(el.textContent, "123");
  // let first = el.firstChild
  state.xs.value = [1, 3, 2];
  await tick();
  // is(el.firstChild, first)
  is(el.textContent, "132");
  state.xs.value = [3, 3, 3];
  await tick();
  is(el.textContent, "333");
  // is(el.firstChild, first)
});

test.skip("each: keyed", async () => {
  // keyed
  let el = h`<div><x :each="x in xs" :text="x" :key="x"></x></div>`;
  let state = sprae(el, { xs: signal([1, 2, 3]) });
  is(el.children.length, 3);
  is(el.textContent, "123");
  let first = el.firstChild;
  state.xs.value = [1, 3, 2];
  await tick();
  is(el.firstChild, first);
  is(el.textContent, "132");
  state.xs.value = [3, 3, 3];
  await tick();
  is(el.textContent, "3");
  // is(el.firstChild, first)
});

test.skip("each: perf", async () => {
  console.time(1);
  let state = sprae(h`<div><x :each="x in 100000" :text="x"></x></div>`);
  console.timeEnd(1);
});

test("each: wrapped source", async () => {
  let el = h`<div><x :each="i in (x || 2)" :text="i"></x></div>`;
  sprae(el, { x: 0 });
  is(el.innerHTML, `<x>0</x><x>1</x>`);
});

test("each: unmounted elements remove listeners", async () => {
  // let's hope they get removed without memory leaks :')
});

test("each: internal children get updated by state update, also: update by running again", async () => {
  let el = h`<><x :each="item, idx in items" :text="item" :key="idx"></x></>`;
  let state = sprae(el, { items: signal([1, 2, 3]) });
  is(el.textContent, "123");
  state.items.value = [2, 2, 3];
  await tick();
  is(el.textContent, "223");
  console.log("items = [0, 2, 3]");
  state.items.value = [0, 2, 3];
  // state = sprae(el, { items: [0, 2, 3] });
  await tick();
  is(el.textContent, "023");
  // NOTE: this doesn't update items, since they're new array
  console.log("state.items[0] = 1");
  console.log(state.items);
  state.items.value[0] = 1;
  bump(state.items);
  // state.items = [...state.items]
  await tick();
  is(el.textContent, "123");
});

test("each: :id and others must receive value from context", () => {
  let el = h`<div><x :each="item, idx in items" :id="idx"></x></div>`;
  sprae(el, { items: [1, 2, 3] });
  is(el.innerHTML, `<x id="0"></x><x id="1"></x><x id="2"></x>`);
});

test.skip("each: key-based caching is in-sync with direct elements", () => {
  // FIXME: I wonder if that's that big of a deal
  let el = h`<ul><li :each="i in x" :key="i" :id="i"></li></ul>`;
  let el2 = h`<ul><li :each="i in x" :id="i"></li></ul>`;
  let state = sprae(el, { x: 2 });
  let state2 = sprae(el2, { x: 2 });
  is(el.outerHTML, el2.outerHTML);
  console.log("---inserts");
  el.firstChild.after(el.firstChild.cloneNode(true));
  el2.firstChild.after(el2.firstChild.cloneNode(true));
  console.log("state.x = 3");
  state.x = 3;
  state2.x = 3;
  is(el.outerHTML, el2.outerHTML);
});

test("each: remove last", () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.value.findIndex((x) => x.id == item.id);
      this.rows.value.splice(index, 1);
      bump(this.rows);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  console.log("Remove id 5");
  s.remove({ id: 5 });
  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr></table>`);
});

test("each: remove first", () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>
  `;

  const rows = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);

  let s = sprae(el, {
    rows,
    remove(item) {
      const index = this.rows.value.findIndex((x) => x.id == item.id);
      this.rows.value.splice(index, 1);
      bump(this.rows);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  console.log("Remove id 1");
  s.remove({ id: 1 });
  is(el.outerHTML, `<table><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
});

test("each: swapping", () => {
  let el = h`<table>
    <tr :each="item in rows" :text="item.id" />
  </table>`;

  const rows = signal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);

  let s = sprae(el, {
    rows,
    swap() {
      const a = this.rows.value[1];
      console.log(`[1]=[4]`);
      this.rows.value[1] = this.rows.value[this.rows.value.length - 2];
      console.log(`[4]=[1]`);
      this.rows.value[this.rows.value.length - 2] = a;
      bump(this.rows);
    },
  });

  is(el.outerHTML, `<table><tr>1</tr><tr>2</tr><tr>3</tr><tr>4</tr><tr>5</tr></table>`);
  s.swap();
  is(el.outerHTML, `<table><tr>1</tr><tr>4</tr><tr>3</tr><tr>2</tr><tr>5</tr></table>`);
});

test("each: with :scope", () => {
  let el = h`<ul><li :each="i in 3" :scope="{x:i}" :text="x"></li></ul>`;
  sprae(el);
  is(el.outerHTML, `<ul><li>0</li><li>1</li><li>2</li></ul>`);
});

test("each: subscribe to modifying list", async () => {
  let el = h`<ul>
    <li :each="item in rows" :text="item" :onremove="e=>remove(item)">
    </li>
  </ul>`;
  const state = sprae(el, {
    rows: signal([1]),
    remove() {
      this.rows.value = [];
    },
  });
  is(el.outerHTML, `<ul><li>1</li></ul>`);
  // state.remove()
  el.querySelector("li").dispatchEvent(new window.Event("remove"));
  console.log("---removed", state.rows);

  await tick();
  is(el.outerHTML, `<ul></ul>`);
});

test("scope: inline assign", async () => {
  let el = h`<x :scope="{foo:'bar'}"><y :text="foo + baz"></y></x>`;
  let state = sprae(el, { baz: signal("qux") });
  is(el.innerHTML, `<y>barqux</y>`);
  state.baz.value = "quux";
  await tick();
  is(el.innerHTML, `<y>barquux</y>`);
});
test("scope: inline assign reactive", () => {
  let el = h`<x :scope="{foo:'bar'}"><y :text="foo + baz"></y></x>`;
  let baz = signal("qux");
  sprae(el, { baz });
  is(el.innerHTML, `<y>barqux</y>`);
  baz.value = "quux";
  is(el.innerHTML, `<y>barquux</y>`);
});
test("scope: assign data", async () => {
  let el = h`<x :scope="{foo:x.foo}"><y :text="foo"></y></x>`;
  let state = sprae(el, { console, x: { foo: signal("bar") } });
  is(el.innerHTML, `<y>bar</y>`);
  state.x.foo.value = "baz";
  await tick();
  // Object.assign(state, { x: { foo: 'baz' } })
  is(el.innerHTML, `<y>baz</y>`);
});
test("scope: assign transparency", async () => {
  let el = h`<x :scope="{foo:'foo'}"><y :scope="{bar:b.bar}" :text="foo+bar"></y></x>`;
  let params = sprae(el, { b: { bar: signal("bar") } });
  is(el.innerHTML, `<y>foobar</y>`);
  params.b.bar.value = "baz";
  await tick();
  is(el.innerHTML, `<y>foobaz</y>`);
});
test("scope: reactive transparency", () => {
  let el = h`<x :scope="{foo:1}"><y :scope="{bar:b.c.bar}" :text="foo+bar"></y></x>`;
  const bar = signal("2");
  sprae(el, { b: { c: { bar } } });
  is(el.innerHTML, `<y>12</y>`);
  bar.value = "3";
  is(el.innerHTML, `<y>13</y>`);
});
test("scope: writes to state", async () => {
  let a = h`<x :scope="{a:signal(1)}"><y :onx="e=>(a.value+=1)" :text="a"></y></x>`;
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
  let a = h`<div><x :text="x"></x><x :scope={x:2} :text="x"></x><x :text="y">3</x></div>`;
  sprae(a, { x: 1, y: 3 });
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});
test("scope: scope directives must come first", async () => {
  // NOTE: we init attributes in order of definition
  let a = h`<x :scope="{y:1}" :text="y" :ref="x"></x>`;
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
  let state = sprae(a, { text: signal("abc") });
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`);
  state.text.value = "def";
  await tick();
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>def</div></x>`);
});

test("html: :scope", async () => {
  let a = h`<template :ref="tpl"><div :text="text"></div></template><x :html="tpl" :scope="{text:'abc'}" />`;
  let state = sprae(a);
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`);
});

test("html: nested items", async () => {
  let el = h`<template :ref="tpl"><div :each="item in items" :text="item.id"></div></template><x :html="tpl" :scope="{items:[{id:'a'},{id:'b'}]}" />`;
  let state = sprae(el);
  is(
    el.outerHTML,
    `<template><div :each="item in items" :text="item.id"></div></template><x><div>a</div><div>b</div></x>`,
  );
});

test.todo("html: template after use", async () => {
  let a = h`<x :html="tpl" :scope="{text:'abc'}" /><template :ref="tpl"><div :text="text"></div></template>`;
  let state = sprae(a);
  is(a.outerHTML, `<x><div>abc</div></x><template><div :text="text"></div></template>`);
});

test("ref: base", async () => {
  let a = h`<a :ref="a" :fx="log.push(a)" :text="b"></a>`;
  let state = sprae(a, { log: [], b: signal(1) });
  await tick();
  is(state.log[0], a);
  is(a.outerHTML, `<a>1</a>`);
  state.b.value = 2;
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
  state.b.value = 2;
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

test("t̵h̵i̵s̵ ̵r̵e̵f̵e̵r̵s̵ ̵t̵o̵ ref: defines current element", async () => {
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
  let el = h`<x :fx="log.push(x.value), () => log.push('out')"></x>`;
  let log = [], x = signal(1)
  let state = sprae(el, { log, x });
  is(el.outerHTML, `<x></x>`);
  is(log, [1])
  x.value = 2
  is(el.outerHTML, `<x></x>`);
  is(log, [1, 'out', 2])
  el[Symbol.dispose]()
  is(log, [1, 'out', 2, 'out'])
});

test.todo("immediate scope", async () => {
  let el = h`<x :scope="{arr:[], inc(){ arr.push(1) }}" :onx="e=>inc()" :text="arr[0]"></x>`;
  sprae(el);
  is(el.outerHTML, `<x></x>`);
  el.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.outerHTML, `<x>1</x>`);
});

test.todo("getters", async () => {
  // FIXME: do via nadi/store
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

test("csp: sandbox", async () => {
  const { default: sprae } = await import('../sprae.csp.js')
  const globals = { console };
  const state = Object.assign(Object.create(globals), { log: [] });

  // let el = h`<x :x="log.push(1)"></x>`
  let el = h`<x :x="log.push( self,  console,  arguments,  __scope)"></x>`;
  const s = sprae(el.cloneNode(), state);
  is(s.log, [undefined, console, undefined, undefined]);

  s.log.splice(0);
  Object.assign(globals, { self: window });
  console.log("--------- sprae again with globals");
  sprae(el.cloneNode(), state);
  is(s.log, [window, console, undefined, undefined]);
});

test("switch signals", async () => {
  const preact = await import('@preact/signals-core')
  sprae.use(preact)

  let el = h`<div :text="x"/>`
  let state = sprae(el, { x: preact.signal(1) })
  is(el.innerHTML, '1')
  state.x.value = 2
  is(el.innerHTML, '2')
})

test.todo("subscribe to array length", async () => {
  // FIXME: do via nadi/list
  let el = h`<div :scope="{likes:[]}"><x :onx="e=>(likes.push(1))"></x><y :text="likes.length"></y></div>`;
  sprae(el);
  is(el.innerHTML, `<x></x><y>0</y>`);
  el.firstChild.dispatchEvent(new window.CustomEvent("x"));
  await tick();
  is(el.innerHTML, `<x></x><y>1</y>`);
});

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
