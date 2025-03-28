import test, { is } from "tst";
import { tick } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";


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

test('text: doesnt get side-triggered', async () => {
  let el = h`
    <div :text="_log++,str"></div>
    <input type="checkbox" :value="bool"/>
  `
  let state = sprae(el, {str:'abc', bool:true, _log:0})
  is(state._log, 1)
  // debugger
  state.bool = false
  is(state._log, 1)
  state.bool = true
  is(state._log, 1)
})
