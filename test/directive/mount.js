import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { signal } from '../../core.js'


test("mount: statement", async () => {
  let el = h`<div :mount="log.push('connected')"></div>`;
  let state = sprae(el, { log: [] });
  is(state.log, ['connected']);
});

test("mount: function receives element", async () => {
  let el = h`<div :mount="el => ref = el"></div>`;
  let state = sprae(el, { ref: null });
  is(state.ref, el);
});

test("mount: function cleanup", async () => {
  let div = h`<div><a :if="show" :mount="el => (log.push('on'), () => log.push('off'))"></a></div>`;
  let state = sprae(div, { log: [], show: true });
  await tick();
  is(state.log, ['on']);

  state.show = false;
  await tick(2);
  is(div.innerHTML, ``);
  is(state.log, ['on', 'off']);
});

test("mount: setup and return value", async () => {
  let el = h`<div :mount="el => (log.push(el.tagName), 42)"></div>`;
  let state = sprae(el, { log: [] });
  is(state.log, ['DIV']);
});

test("mount: runs once (not reactive)", async () => {
  let el = h`<div :mount="log.push(count)"></div>`;
  let state = sprae(el, { log: [], count: 1 });
  is(state.log, [1]);

  state.count = 2;
  await tick();
  // should NOT re-run — :mount is lifecycle, not reactive
  is(state.log, [1]);
});

test("mount: with :each", async () => {
  let el = h`<div><span :each="item in items" :mount="el => log.push(item)" :text="item"></span></div>`;
  let state = sprae(el, { log: [], items: ['a', 'b', 'c'] });
  await tick();
  is(el.innerHTML, `<span>a</span><span>b</span><span>c</span>`);
  is(state.log, ['a', 'b', 'c']);
});

test("mount: with :if", async () => {
  let div = h`<div><a :if="show" :mount="log.push('mounted')"></a></div>`;
  let state = sprae(div, { log: [], show: false });
  await tick();
  is(state.log, []);

  state.show = true;
  await tick();
  is(state.log, ['mounted']);
});
