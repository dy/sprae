import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'


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
  await tick()
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

test("text: preserves text node when value unchanged", async () => {
  let el = h`<div :text="text"></div>`;
  let state = sprae(el, { text: "abc" });
  is(el.textContent, 'abc');
  let textNode = el.firstChild;

  // trigger re-evaluation without changing value
  state.text = "abc";
  await tick();

  // text node should be the same object, not replaced
  is(el.firstChild, textNode, 'text node should not be replaced when value unchanged');
});

test("text: does not destroy selection when value unchanged", async () => {
  let el = h`<div :text="text" contenteditable></div>`;
  document.body.appendChild(el);
  let state = sprae(el, { text: "hello world" });
  await tick();

  // set a selection range
  let s = window.getSelection();
  let r = new Range();
  r.setStart(el.firstChild, 2);
  r.setEnd(el.firstChild, 7);
  s.removeAllRanges();
  s.addRange(r);

  ok(!s.isCollapsed, 'selection should be non-collapsed before re-eval');

  // trigger re-evaluation without changing value
  state.text = "hello world";
  await tick();

  // selection should still be intact
  ok(s.rangeCount > 0, 'selection should still exist');
  ok(!s.isCollapsed, 'selection should remain non-collapsed after unchanged text re-eval');

  document.body.removeChild(el);
});

test("text: preserves caret position when value changes", async () => {
  let el = h`<div :text="text" contenteditable></div>`;
  document.body.appendChild(el);
  let state = sprae(el, { text: "abcdef" });
  await tick();

  // place caret at position 3
  let s = window.getSelection();
  let r = new Range();
  r.setStart(el.firstChild, 3);
  r.collapse(true);
  s.removeAllRanges();
  s.addRange(r);

  is(s.getRangeAt(0).startOffset, 3, 'caret should be at 3 before update');

  // change the text (appending)
  state.text = "abcdefgh";
  await tick();

  is(el.textContent, 'abcdefgh');
  ok(s.rangeCount > 0, 'selection should exist after text change');
  is(s.getRangeAt(0).startOffset, 3, 'caret should remain at 3 after text change');

  document.body.removeChild(el);
});

test("text: clamps caret when text shrinks", async () => {
  let el = h`<div :text="text" contenteditable></div>`;
  document.body.appendChild(el);
  let state = sprae(el, { text: "abcdef" });
  await tick();

  // place caret at position 5
  let s = window.getSelection();
  let r = new Range();
  r.setStart(el.firstChild, 5);
  r.collapse(true);
  s.removeAllRanges();
  s.addRange(r);

  // shrink text to 3 chars
  state.text = "abc";
  await tick();

  is(el.textContent, 'abc');
  ok(s.rangeCount > 0, 'selection should exist');
  ok(s.getRangeAt(0).startOffset <= 3, 'caret should be clamped to new text length');

  document.body.removeChild(el);
});

test("text: throttle-raf does not destroy selection when unrelated state changes", async () => {
  let el = h`<div :text.throttle-raf="text"></div>`;
  document.body.appendChild(el);
  let state = sprae(el, { text: "hello world", other: 0 });
  await tick();
  // wait for throttle-raf to settle
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  is(el.textContent, 'hello world');
  let textNode = el.firstChild;

  // set a selection range
  let s = window.getSelection();
  let r = new Range();
  r.setStart(el.firstChild, 2);
  r.setEnd(el.firstChild, 7);
  s.removeAllRanges();
  s.addRange(r);

  ok(!s.isCollapsed, 'selection should be non-collapsed');

  // change unrelated state
  state.other = 1;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // text node should be the same, selection should be intact
  is(el.firstChild, textNode, 'text node should not be replaced');
  ok(s.rangeCount > 0 && !s.isCollapsed, 'selection should survive unrelated state change');

  document.body.removeChild(el);
});

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
