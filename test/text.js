import test, { is, any, throws } from "tst";
import { tick, time } from "wait-please";
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
