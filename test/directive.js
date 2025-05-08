import { _dispose } from "../core.js";
import { tick, time } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";
import { _off, _state } from "../core.js";
import test, { any, is } from "tst";
import { signal, batch, untracked } from '../signal.js'


test("any: basic", async () => {
  let el = h`<label :for="name" :text="name" ></label><input type='text' :type="t => (log.push(t),name)" :id="name" :name="name" :disabled="!name"/><a :href="url"></a><img :src="url"/>`;
  let params = sprae(el, { name: 'text', url: "//google.com", log:[] });
  is(
    el.outerHTML,
    `<label for="text">text</label><input type="text" id="text" name="text"><a href="//google.com"></a><img src="//google.com">`,
  );
  is(params.log, ['text'])
  params.name = "email";
  await tick();
  is(
    el.outerHTML,
    `<label for="email">email</label><input type="email" id="email" name="email"><a href="//google.com"></a><img src="//google.com">`,
  );
});

test("any: signal", async () => {
  let a = signal();
  setTimeout(() => (a.value = 2), 10);

  let el = h`<x :text="a">1</x>`;
  sprae(el, { a });
  is(el.outerHTML, `<x></x>`);

  await time(20);
  is(el.outerHTML, `<x>2</x>`);
});

test("any: null result does nothing", async () => {
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


test('class: basic', async () => {
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

test('class: undefined value', async () => {
  let el = h`<x :class="a"></x><y :class="[b]"></y><z :class="{c}"></z>`;
  sprae(el, { a: undefined, b: undefined, c: undefined });
  is(el.outerHTML, `<x></x><y></y><z></z>`);
});

test('class: old svg fun', async () => {
  // raw html creates SVGAnimatedString
  let el = document.createElement("div");
  el.innerHTML = `<svg class="foo" :class="a ? 'x' : 'y'"></svg>`;

  let s = sprae(el, { a: true });
  is(el.innerHTML, `<svg class="foo x"></svg>`);
  s.a = false;
  await tick();
  is(el.innerHTML, `<svg class="foo y"></svg>`);
});

test('class: function', async () => {
  let el = document.createElement("div");
  el.innerHTML = `<div class="foo" :class="cn => (log.push(cn), [cn, a])"></div>`;

  let s = sprae(el, { a: 'a', log: [] });
  is(el.innerHTML, `<div class="foo a"></div>`);
  is(s.log, ['foo'])

  console.log('----- s.a="b" ')
  s.a = 'b';
  await tick();
  is(el.innerHTML, `<div class="foo a b"></div>`);
  is(s.log, ['foo', 'foo a'])
});


test.skip("class: interpolation", async () => {
  let el = h`<x :class="'a $<b> c-$<c>'"></x>`;
  sprae(el, { a: 'a', b: 'b', c: 0 });
  is(el.outerHTML, `<x class="a b c-0"></x>`);
});



test("style: basic", async () => {
  let el = h`<x style="left: 1px" :style="style"></x>`;
  let params = sprae(el, { style: "top: 1px" });
  is(el.outerHTML, `<x style="left: 1px; top: 1px"></x>`);

  params.style = { top: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);


  params.style = { top: "1px", bottom: "2px" };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 1px; bottom: 2px;"></x>`);

  params.style = { top: "2px", bottom: null };
  await tick();
  is(el.outerHTML, `<x style="left: 1px; top: 2px;"></x>`);
});

test("style: props", async () => {
  let el = h`<x :style="style"></x>`;
  let params = sprae(el, { style: {} });
  is(el.outerHTML, `<x></x>`);

  params.style = { "--x": 123 };
  await tick();
  is(el.style.getPropertyValue("--x"), "123");

  params.style = { "--x": null };
  await tick();
  is(el.style.getPropertyValue("--x"), '');
});

test("style: camel kebab", async () => {
  let el = h`<x :style="style"></x>`;
  let params = sprae(el, { style: { backgroundColor: "red" } });
  is(el.outerHTML, `<x style="background-color: red;"></x>`);

  params.style.backgroundColor = 'green'
  is(el.outerHTML, `<x style="background-color: green;"></x>`);
});

test("style: #33", async () => {
  let el = h`<header class="navbar" :style="{ color: 'white', backgroundColor: '#df0000' }" />`
  sprae(el)
  is(el.outerHTML, `<header class="navbar" style="color: white; background-color: rgb(223, 0, 0);"></header>`)
})

test("style: function", async () => {
  // NOTE: ...s is intentional mistake here
  let el = h`<x :style="s => (log.push(s),{...s, '--i':i})"></x>`;
  let s = sprae(el, { log:[], i:0 });
  is(s.log, [el.style])
  is(el.outerHTML, `<x style="--i: 0;"></x>`);
  is(el.style.getPropertyValue("--i"), "0");

  console.log('----- s.i++')
  s.i++
  await tick();
  is(s.log, [el.style, el.style])
  is(el.outerHTML, `<x style="--i: 1;"></x>`);
  is(el.style.getPropertyValue("--i"), "1");

  s.i = null
  await tick();
  is(s.log, [el.style, el.style, el.style])
  is(el.outerHTML, `<x style=""></x>`);
  is(el.style.getPropertyValue("--i"), "");
});



test("text: core", async () => {
  let el = h`<div :text="text"></div>`;
  let params = sprae(el, { text: "abc" });
  is(el.outerHTML, `<div>abc</div>`);
  params.text = null;
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("text: function", async () => {
  let el = h`<div :text="t => t + s"></div>`;
  let params = sprae(el, { s: 'a' });
  is(el.outerHTML, `<div>a</div>`);
  params.s = 'b';
  await tick();
  is(el.outerHTML, `<div>ab</div>`);
  params.s = 'c';
  is(el.outerHTML, `<div>abc</div>`);
});

test("text: fragment", async () => {
  let el = h`a<template :text="text"/>`;
  let params = sprae(el, { text: "b" });
  is(el.outerHTML, `ab`);
  params.text = 'bc';
  await tick();
  is(el.outerHTML, `abc`);
});

test("text: fragment with condition", async () => {
  // NOTE: this ignores condition
  let el = h`a<template :text="text" :if="text!='b'"/>`;
  let params = sprae(el, { text: "b" });
  is(el.outerHTML, `ab`);
  params.text = 'c';
  await tick();
  is(el.outerHTML, `ac`);
})

test("text: condition with fragment", async () => {
  let el = h`a<template :if="text!='b'" :text="text"/>`;
  let params = sprae(el, { text: "b" });
  is(el.outerHTML, `a`);
  console.log("params.text = 'c'")
  params.text = 'c';
  await tick();
  is(el.outerHTML, `ac`);
})

test("text: doesnt get side-triggered", async () => {
  let el = h`
    <div :text="_log++,str"></div>
    <input type="checkbox" :value="bool"/>
  `
  let state = sprae(el, { str: 'abc', bool: true, _log: 0 })
  is(state._log, 1)
  // debugger
  state.bool = false
  is(state._log, 1)
  state.bool = true
  is(state._log, 1)
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

test("if: overlapping conditions", async () => {
  let el = h`<p>
    <if :if="a<1">a</if>
    <elif :else :if="a<2">b</elif>
    <elif :else :if="a<3">c</elif>
    <else :else >d</else>
  </p>`;

  const params = sprae(el, { a: 0 });

  is(el.innerHTML, "<if>a</if>");
  console.log('---a.value = 1')
  params.a = 1;
  await tick();
  is(el.innerHTML, "<elif>b</elif>");
  console.log('---a.value = 2')
  params.a = 2;
  await tick();
  is(el.innerHTML, "<elif>c</elif>");
  console.log('---a.value = 3')
  params.a = 3;
  await tick();
  is(el.innerHTML, "<else>d</else>");
  console.log('---a.value = null')
  params.a = null;
  await tick();
  is(el.innerHTML, "<if>a</if>");
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

test("if: + :scope doesnt prevent secondary effects from happening", async () => {
  let el = h`<div><x :if="x" :scope="{}" :text="x"></x></div>`;
  let state = sprae(el, { x: "" });
  is(el.innerHTML, ``);
  console.log("state.x=123");
  state.x = "123";
  await tick();
  is(el.innerHTML, `<x>123</x>`);
});

test("if: + :scope back-forth", async () => {
  let el = h`<div><x :if="x" :scope="{}" :text="x" :onx="()=>x+=x"></x><y :else :scope="{t:'y'}" :text="t" :onx="()=>t+=t"></y></div>`;
  let state = sprae(el, { x: "" });
  is(el.innerHTML, `<y>y</y>`);
  el.firstChild.dispatchEvent(new window.CustomEvent('x'))
  is(el.innerHTML, `<y>yy</y>`);

  console.log("state.x=x");
  state.x = "x";
  await tick();
  is(el.innerHTML, `<x>x</x>`);
  el.firstChild.dispatchEvent(new window.CustomEvent('x'))
  is(el.innerHTML, `<x>xx</x>`);
  state.x = ''
  is(el.innerHTML, `<y>yy</y>`);
  el.firstChild.dispatchEvent(new window.CustomEvent('x'))
  is(el.innerHTML, `<y>yyyy</y>`);

  el[_dispose]()
  is(el.innerHTML, `<y>yyyy</y>`);
});

test("if: :scope + :if after attributes", async () => {
  let el = h`<c><x :scope="{x:1}" :if="cur === 1" :text="x"></x><y :scope="{x:2}" :if="cur === 2" :text="x"></y></c>`

  let s = sprae(el, { cur: 1 })
  is(el.innerHTML, `<x>1</x>`)

  console.log('------- s.cur = 2')
  s.cur = 2
  is(el.innerHTML, `<y>2</y>`)
})

test('if: set/unset value', async () => {
  let el = h`<x><y :if="x" :text="x.x"></y></x>`
  let state = sprae(el, { x: null })
  is(el.innerHTML, '')
  state.x = { x: 1 }
  is(el.innerHTML, '<y>1</y>')
  console.log('------state.x = null')
  // NOTE: @preact/signals unsubscribes x.x
  state.x = null
  is(el.innerHTML, '')
  console.log('------state.x = {x:2}')
  state.x = { x: 2 }
  is(el.innerHTML, '<y>2</y>')
})

test('if: set/unset 2', async () => {
  let el = h`<root><x :if="x==1"><t :text="a"></t></x><y :else :if="x==2"><t :text="b"></t></y><z :else :text="c"></z></root>`
  let state = sprae(el, { x: 1, a: 'a', b: 'b', c: 'c' })
  is(el.innerHTML, '<x><t>a</t></x>', 'x==1')
  state.x = null
  is(el.innerHTML, `<z>c</z>`, 'x==null')
  state.x = 1
  is(el.innerHTML, '<x><t>a</t></x>', 'x==1')
  state.a = 'aa'
  is(el.innerHTML, '<x><t>aa</t></x>', 'x==1')
  state.x = 2
  is(el.innerHTML, '<y><t>b</t></y>', 'x==2')
  state.b = 'bb'
  is(el.innerHTML, '<y><t>bb</t></y>', 'x==2')
  state.a = 'aaa'
  state.x = 1
  is(el.innerHTML, '<x><t>aaa</t></x>', 'x==1')
  state.x = 3
  is(el.innerHTML, '<z>c</z>', 'x==9')
})

test.skip('if: lost effects', () => {
  let el = h`<div>
    <input type="checkbox" :value="showlist"/>
    <button :onclick="() => {list.push(list.length)}">Add element</button>
    <button :onclick="() => {list.pop()}">Remove element</button>
    <button :onclick="() => {list[0]++}">Increment first element</button>
    <br/>
    <select :if="showlist" size="10" style="width:5rem">
      <option :each="i in list" :text="i"></option>
    </select>
    <select :if="showlist" size="10" style="border: solid 1px orange; width:5rem">
      <option :each="i in listFromFunc()" :text="i"></option>
    </select>
    </div>`
  document.body.append(el)
  sprae(el, {
    showlist: true,
    list: [],
    listFromFunc() { return this.list.map(val => val) }
  })
})

test('if: #59', () => {
  let el = h`<div id="container">
    <div :if="test()">123</div>
    ABC
    <div :if="test()">456</div>
  </div>`
  sprae(el, { test: () => true })
  is(el.innerHTML, `<div>123</div>ABC<div>456</div>`)
})



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

test("ref: fn base", async () => {
  let a = h`<a :ref="el => a=el" :fx="log.push(a)" :text="b"></a>`;
  let state = sprae(a, { log: [], b: 1, a: null });
  await tick();
  is(state.log[0], a);
  is(a.outerHTML, `<a>1</a>`);
  state.b = 2;
  await tick();
  is(a.outerHTML, `<a>2</a>`);
  is(state.a, a, "Exposes to the state");
});

test("ref: fn signal", async () => {
  let a = h`<a :ref="el => a=el" :text="b"></a>`;
  let state = sprae(a, { a: signal(), b: signal(1) });
  await tick();
  is(state.a, a);
  is(a.outerHTML, `<a>1</a>`);
  state.b = 2;
  await tick();
  is(a.outerHTML, `<a>2</a>`);
  is(state.a, a, "Exposes to the state");
});

test("ref: fn with :each", async () => {
  let a = h`<y><x :each="item in items" :scope="{x:null}" :ref="el => x=el" :text="log.push(x), item"/></y>`;
  let state = sprae(a, { log: [], items: [1, 2, 3] });
  await tick();
  is(state.log, [...a.children]);
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});

test("ref: fn unmount", async () => {
  let div = h`<div><a :if="a" :ref="el => (log.push('on'), () => log.push('off'))" :text="b"></a></div>`;
  let state = sprae(div, { log: [], b: 1, a: 1 });
  await tick();
  is(state.log, ['on']);
  is(div.innerHTML, `<a>1</a>`);
  console.log('----state.a=0')
  state.a = 0
  await tick();
  is(div.innerHTML, ``);
  is(state.log, ['on', 'off']);
});

test('ref: create in state as untracked', async () => {
  let div = h`<div :scope="{_x:null,log(){console.log(_x)}}" :onx="log"><x :ref="_x" :text="_x?.tagName"></x></div>`;
  let state = sprae(div)

  is(div[_state]._x, div.firstChild)
  div.dispatchEvent(new window.CustomEvent("x"));
  is(div[_state]._x, div.firstChild)
})

test('ref: create in state as direct', async () => {
  let div = h`<div :scope="{x:null,log(){console.log(x)}}" :onx="log"><x :ref="x" :text="x?.tagName"></x></div>`;
  let state = sprae(div)
  is(div[_state].x, div.firstChild)
  // reading :ref=x normally (one level) would not subscribe root, but nested one may subscribe parent :scope
  div.dispatchEvent(new window.CustomEvent("x"));
  is(div[_state].x, div.firstChild)
})

test('ref: duplicates', async () => {
  let el = h`<x><y :ref="y"></y><z :ref="y"></z></x>`
  let state = sprae(el)
  is(state.y, el.lastChild)
})



test("scope: inline assign", async () => {
  let el = h`<x :scope="foo='bar'"><y :text="console.log('effect text',foo),foo + baz"></y></x>`;
  let state = sprae(el, { baz: signal("qux") });
  is(el.innerHTML, `<y>barqux</y>`);
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
  is(el.innerHTML, `<y>bar</y>`);
  state.x.foo = "baz";
  await tick();
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
  let a = h`<div><x :text="x"></x><x :scope="{x:2}" :text="x"></x><x :text="y">3</x></div>`;
  sprae(a, { x: 1, y: 3 });
  is(a.innerHTML, `<x>1</x><x>2</x><x>3</x>`);
});

test("scope: scope directives must come first", async () => {
  // NOTE: we have to init attributes in order of definition
  let a = h`<x :scope="{y:1}" :text="y" :ref="el=>x=el"></x>`;
  sprae(a, { x: null });
  is(a.outerHTML, `<x>1</x>`);
});

test("scope: new prop added to superstore", async () => {
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
  is(a.innerHTML, `<y>xy</y>`)
  s.y = 'yy'
  is(a.innerHTML, `<y>xyy</y>`)
})



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
  is(s, { obj: '2' })
})

test("value: reflect #57", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, { a: 0 });
  is(state.a, 0);
  is(el.outerHTML, `<input value="0">`);
});

test("value: reflect ensure value", async () => {
  let el = h`<input :value="a" />`;
  let state = sprae(el, {});
  is(state.a, '');
  is(el.outerHTML, `<input value="">`);
});




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
  await tick()
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
  await tick()
  is(el.innerHTML, "");
  console.log("b.value=[]");
  b.value = [];
  await tick()
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
  let el = h`<div><x :each="x in 3" :data-x="x" :scope="{el:null}" :ref="e=>(el=e)" :x="console.log(el),log.push(x, el.dataset.x)"></x></div>`;
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
  // let's hope they get removed without memory leaks...
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

test("each: with :scope", () => {
  let el = h`<ul><li :each="i in 3" :scope="{x:i}" :text="x"></li></ul>`;
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

test('each: unwanted extra subscription', async () => {
  let el = h`<div><x :each="item,i in (console.log('upd',_count),_count++, rows)"><a :text="item.label"></a></x></div>`

  const rows = signal(null)
  const state = sprae(el, { rows, _count: 0, console })

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

test('each: batched .length updates', async () => {
  let c = 0
  let state = store({ list: [1, 2], count() { c++ } })
  let el = h`<a><b :each="x in (count(), list)" :text="x"/></a>`
  sprae(el, state)
  await tick()
  is(c, 1)
  is(el.innerHTML, `<b>1</b><b>2</b>`)

  console.log('--------list.push(3,4,5)')
  state.list.push(3, 4, 5)
  await tick()
  is(c, 1)

  // bump list
  batch(() => {
    let list = state.list
    state.list = null
    state.list = list
  })
  await tick()
  any(c, [2, 3])
})

// NOTE: item is readonly
test.skip('each: rewrite item', async () => {
  let el = h`<a><x :each="i in items" :text="i" :onx="e=>i++"/></a>`
  sprae(el, { items: [1, 2, 3] })
  is(el.innerHTML, `<x>1</x><x>2</x><x>3</x>`)
  el.childNodes[1].dispatchEvent(new window.Event("x"))
  is(el.innerHTML, `<x>1</x><x>3</x><x>3</x>`)
})

test('each: init within template', async () => {
  await tick()
  let el = h`<div><template :each="a in [1,2]">
      <a :x="a"><b :text="a"></b></a>
  </template></div>`;

  sprae(el);
  is(el.innerHTML, `<a x="1"><b>1</b></a><a x="2"><b>2</b></a>`)

  document.body.appendChild(el)
  console.log(el.innerHTML)
})
