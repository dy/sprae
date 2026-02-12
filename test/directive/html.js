import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked, _dispose } from '../../core.js'

const isJessie = process.env.SPRAE_COMPILER === 'jessie'

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
  let el = h`<div :html="h => h + suffix"></div>`;
  let params = sprae(el, { suffix: '!' });
  is(el.outerHTML, `<div>!</div>`);
  params.suffix = '<b>!</b>';
  await tick();
  is(el.outerHTML, `<div>!<b>!</b></div>`);
});


test("html: fragment function", async () => {
  // jessie: causes hang after test completion
  let el = h`<div><template :html="h => h + suffix"></template></div>`;
  let params = sprae(el, { suffix: '!' });
  is(el.innerHTML, `!`);
  params.suffix = '<b>!</b>';
  await tick();
  is(el.innerHTML, `!<b>!</b>`);
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
