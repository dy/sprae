import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked, _dispose } from '../../core.js'

const isJessie = globalThis.process?.env?.SPRAE_COMPILER === 'jessie'

test("html: core", async () => {
  let el = h`<div :html="html"></div>`;
  let params = sprae(el, { html: "<b>bold</b>" });
  is(el.outerHTML, `<div><b>bold</b></div>`);
  params.html = "<i>italic</i>";
  await tick();
  is(el.outerHTML, `<div><i>italic</i></div>`);
});

test("html: null/empty", async () => {
  let el = h`<div :html="html"></div>`;
  let params = sprae(el, { html: "<b>bold</b>" });
  is(el.outerHTML, `<div><b>bold</b></div>`);
  params.html = null;
  await tick();
  is(el.outerHTML, `<div></div>`);
  params.html = undefined;
  await tick();
  is(el.outerHTML, `<div></div>`);
  params.html = "";
  await tick();
  is(el.outerHTML, `<div></div>`);
});

test("html: fragment", async () => {
  let el = h`a<template :html="html"/>`;
  let params = sprae(el, { html: "<b>b</b>" });
  is(el.outerHTML, `a<b>b</b>`);
  params.html = '<i>c</i>';
  await tick();
  is(el.outerHTML, `a<i>c</i>`);
});

test("html: function", async () => {
  // jessie: causes hang after test completion
  let el = h`<div :html="h => h + suffix"><a>!</a></div>`;
  let params = sprae(el, { suffix: '!' });
  is(el.innerHTML, `<a>!</a>!`);
  params.suffix = '<b>!</b>';
  await tick();
  is(el.innerHTML, `<a>!</a>!<b>!</b>`);
});


test("html: fragment function", async () => {
  // jessie: causes hang after test completion
  let el = h`<div><template :html="h => h + suffix"><a>!</a></template></div>`;
  let params = sprae(el, { suffix: '!' });
  is(el.innerHTML, `<a>!</a>!`);
  params.suffix = '<b>!</b>';
  await tick();
  is(el.innerHTML, `<a>!</a>!<b>!</b>`);
});

test("html: nested sprae elements", async () => {
  let el = h`<div :html="html"></div>`;
  let params = sprae(el, { html: '<span :text="name"></span>', name: 'world' });
  is(el.outerHTML, `<div><span>world</span></div>`);
  params.name = 'sprae';
  await tick();
  is(el.outerHTML, `<div><span>sprae</span></div>`);
});

test("html: dynamic content with state", async () => {
  let el = h`<div :html="html"></div>`;
  let params = sprae(el, { html: '<span :text="count"></span>', count: 0 });
  is(el.outerHTML, `<div><span>0</span></div>`);
  params.count = 42;
  await tick();
  is(el.outerHTML, `<div><span>42</span></div>`);
});

test("html: template element", async () => {
  let tpl = h`<template><span :text="name"></span></template>`;
  let el = h`<div :html="tpl"></div>`;
  let params = sprae(el, { tpl, name: 'world' });
  is(el.outerHTML, `<div><span>world</span></div>`);
  params.name = 'sprae';
  await tick();
  is(el.outerHTML, `<div><span>sprae</span></div>`);
});

test("html: template element switch", async () => {
  let a = h`<template><b :text="name"></b></template>`;
  let b = h`<template><i :text="name"></i></template>`;
  let el = h`<div :html="tpl"></div>`;
  let params = sprae(el, { tpl: a, name: 'world' });
  is(el.outerHTML, `<div><b>world</b></div>`);
  params.tpl = b;
  await tick();
  is(el.outerHTML, `<div><i>world</i></div>`);
  params.name = 'sprae';
  await tick();
  is(el.outerHTML, `<div><i>sprae</i></div>`);
});

test("html: with condition", async () => {
  let el = h`<div><span :if="show" :html="html"></span></div>`;
  let params = sprae(el, { show: true, html: '<b>content</b>' });
  is(el.innerHTML, `<span><b>content</b></span>`);
  params.show = false;
  await tick();
  is(el.innerHTML, ``);
  params.show = true;
  await tick();
  is(el.innerHTML, `<span><b>content</b></span>`);
});

test("html: fragment with condition", async () => {
  let el = h`<div><template :if="show" :html="html"></template></div>`;
  let params = sprae(el, { show: true, html: '<b>content</b>' });
  is(el.innerHTML, `<b>content</b>`);
  params.show = false;
  await tick();
  is(el.innerHTML, ``);
  params.show = true;
  await tick();
  is(el.innerHTML, `<b>content</b>`);
});

test("html: special characters", async () => {
  let el = h`<div :html="html"></div>`;
  let params = sprae(el, { html: '<p>&amp; &lt; &gt;</p>' });
  is(el.innerHTML, `<p>&amp; &lt; &gt;</p>`);
});

test("html: multiple elements", async () => {
  let el = h`<div :html="html"></div>`;
  let params = sprae(el, { html: '<span>a</span><span>b</span><span>c</span>' });
  is(el.innerHTML, `<span>a</span><span>b</span><span>c</span>`);
  params.html = '<p>single</p>';
  await tick();
  is(el.innerHTML, `<p>single</p>`);
});

test("html: doesnt get side-triggered", async () => {
  let el = h`
    <div :html="_log++,'<b>'+str+'</b>'"></div>
    <input type="checkbox" :value="bool"/>
  `
  let state = sprae(el, { str: 'abc', bool: true, _log: 0 })
  is(state._log, 1)
  state.bool = false
  is(state._log, 1)
  state.bool = true
  is(state._log, 1)
})

test("html: with :scope", async () => {
  let el = h`<div><div :scope="{ bar: 'bar' }" :html="html"></div></div>`;
  let s = sprae(el, { foo: "foo", html: `<a :text="foo+bar"></a>` });
  await tick();
  is(el.innerHTML, `<div><a>foobar</a></div>`);
  s.foo = "moo";
  await tick();
  is(el.innerHTML, `<div><a>moobar</a></div>`);
})

test("html: fragment with :scope", async () => {
  let el = h`<div><template :scope="{ bar: 'bar' }" :html="html"></template></div>`;
  let s = sprae(el, { foo: "foo", html: `<a :text="foo+bar"></a>` });
  await tick();
  is(el.innerHTML, `<a>foobar</a>`);
  s.foo = "moo";
  await tick();
  is(el.innerHTML, `<a>moobar</a>`);
})

test("html: fragment template element", async () => {
  let tpl = h`<template><a :text="foo+bar"></a></template>`;
  let el = h`<div><template :scope="{ bar: 'bar' }" :html="tpl"></template></div>`;
  let s = sprae(el, { foo: "foo", tpl });
  await tick();
  is(el.innerHTML, `<a>foobar</a>`);
  s.foo = "moo";
  await tick();
  is(el.innerHTML, `<a>moobar</a>`);
})

test("html: async partial with :if toggle (modal pattern)", async () => {
  let el = h`<div><div :html="html"></div><button :onclick="showAdd = true">open</button></div>`;
  let s = sprae(el, { html: '', showAdd: false, activeTab: 'expenses' });
  await tick();
  is(el.querySelector('[data-modal]'), null);

  s.html = '<div data-modal :if="showAdd && activeTab === \'expenses\'"><h2>Add Expense</h2></div>';
  await tick();
  is(el.querySelector('[data-modal]'), null, ':if hides when showAdd=false');

  s.showAdd = true;
  await tick();
  ok(el.querySelector('[data-modal]'), ':if shows when showAdd=true');
  ok(el.querySelector('h2'), 'heading visible');

  s.showAdd = false;
  await tick();
  is(el.querySelector('[data-modal]'), null, ':if hides again');

  s.showAdd = true;
  await tick();
  ok(el.querySelector('[data-modal]'), ':if re-shows');
})

test("html: :if with :onclick.outside inside :html (modal close pattern)", async () => {
  let el = h`<div><div :html="html"></div><button id="open" :onclick="showAdd = true">open</button></div>`;
  document.body.appendChild(el);
  let s = sprae(el, { html: '', showAdd: false, activeTab: 'expenses' });
  await tick();

  s.html = '<div id="modal" :if="showAdd && activeTab === \'expenses\'"><div :onclick.outside="e => showAdd = false"><h2>Add Expense</h2></div></div>';
  await tick();
  is(el.querySelector('#modal'), null, 'modal hidden initially');

  let btn = el.querySelector('#open');
  let evt = btn.ownerDocument.createEvent('Event');
  evt.initEvent('click', true, true);
  btn.dispatchEvent(evt);
  await tick();
  ok(s.showAdd, 'showAdd stays true (away must not fire on opening click)');
  ok(el.querySelector('#modal'), 'modal shows after button click');

  s.showAdd = false;
  await tick();
  is(el.querySelector('#modal'), null, 'modal hides after showAdd=false');

  let evt2 = btn.ownerDocument.createEvent('Event');
  evt2.initEvent('click', true, true);
  btn.dispatchEvent(evt2);
  await tick();
  ok(el.querySelector('#modal'), 'modal re-shows after second click');

  el.remove();
})

test("html: nested :if - inner :text survives outer off/on", async () => {
  let el = h`<root><x :if="outer"><y :if="inner"><z id="out" :text="form.name"></z></y></x></root>`;
  let s = sprae(el, { outer: true, inner: true, form: { name: 'hello' } });
  await tick(3);
  is(el.querySelector('#out')?.textContent, 'hello', 'initial value');

  s.outer = false;
  await tick(3);

  s.form = { name: 'world' };
  s.outer = true;
  await tick(3);

  is(el.querySelector('#out')?.textContent, 'world', ':text reflects new state after outer off/on');
})
