import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";
import '../directive/aria.js'
import '../directive/data.js'
import '../directive/html.js'

// import compile from "subscript/justin";
// sprae.use({ compile })

test("aria: base", async () => {
  let el = h`<input type="text" id="jokes" role="combobox" :aria="{controls:'joketypes', autocomplete:'list', expanded:false, activeOption:'item1', activedescendant:'', xxx:null}"/>`;
  sprae(el);
  is(
    el.outerHTML,
    `<input type="text" id="jokes" role="combobox" aria-controls="joketypes" aria-autocomplete="list" aria-expanded="false" aria-active-option="item1" aria-activedescendant="">`,
  );
});

test("data: base", async () => {
  let el = h`<input :data="{a:1, fooBar:2, UpperCase:3}"/>`;
  sprae(el);
  is(el.outerHTML, `<input data-a="1" data-foo-bar="2" data--upper-case="3">`);
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
  sprae(a);
  is(a.outerHTML, `<template><div :text="text"></div></template><x><div>abc</div></x>`);
});

test("html: nested items", async () => {
  let el = h`<template :ref="tpl"><div :each="item in items" :text="item.id"></div></template><x :html="tpl" :with="{items:[{id:'a'},{id:'b'}]}" />`;
  sprae(el);
  is(
    el.outerHTML,
    `<template><div :each="item in items" :text="item.id"></div></template><x><div>a</div><div>b</div></x>`,
  );
});

test.skip("html: template after use", async () => {
  let a = h`<x :html="tpl" :with="{text:'abc'}" /><template :ref="tpl"><div :text="text"></div></template>`;
  sprae(a);
  is(a.outerHTML, `<x><div>abc</div></x><template><div :text="text"></div></template>`);
});
