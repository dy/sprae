import { frame, idle, tick, time } from "wait-please";
import sprae from '../sprae.js'
import h from "hyperf";
import test, { any, is } from "tst";

test("modifier: debounce-time", async () => {
  let el = h`<ul><li :each.debounce-50="item in list" :text="item"></li></ul>`;
  let state = sprae(el, { list: [] });
  state.list = [1];
  is(el.children.length, 0);
  await time(60);
  is(el.children.length, 1);
  is(el.firstChild.textContent, '1');

  state.list = [1, 2];
  state.list = [1, 2, 3];
  await time(60);
  is(el.children.length, 3);
});

test("modifier: debounce-tick", async () => {
  let el = h`<div :class.debounce-tick="active && 'active'" :text="txt"></div>`;
  let state = sprae(el, { active: false, txt: 'test' });
  is(el.className, '');
  state.active = true;
  is(el.className, '');
  await tick(1);
  is(el.className, 'active');

  state.active = false;
  is(el.className, 'active');
  await tick(1);
  is(el.className, '');
});

test("modifier: throttle-time", async () => {
  let el = h`<div :text.throttle-50="txt.length"></div>`;
  let state = sprae(el, { txt: '' });
  is(el.textContent, '0');
  state.txt = 'a';
  state.txt = 'ab';
  is(el.textContent, '0');
  await time(60);
  is(el.textContent, '2');
  state.txt = 'abc';
  is(el.textContent, '2');
  await time(60);
  is(el.textContent, '3');
});

test("modifier: debounce-raf", async () => {
  let el = h`<div :style.debounce-raf="{'--progress': progress + '%'}"></div>`;
  let state = sprae(el, { progress: 0 });
  state.progress = 10;
  state.progress = 20;
  is(el.style.getPropertyValue('--progress'), '');
  await frame(1);
  is(el.style.getPropertyValue('--progress'), '20%');
});

test("modifier: once", async () => {
  let el = h`<div :fx.once="log.push(x)"></div>`;
  let state = sprae(el, { log: [], x: 1 });
  is(state.log, [1]);
  state.x = 2; // Reset
  await tick(1);
  is(state.log, [1]);
});

test("modifier: debounce-idle", async () => {
  let el = h`<div :fx.debounce-idle="log.push(txt)"></div>`;
  let state = sprae(el, { log: [], txt: 'test' });
  await tick(1);
  is(state.log, []);
  await idle();
  is(state.log, ['test']);
});

test("modifier: any", async () => {
  let el = h`<span :fx.once="log.push('init', x)" :fx.update="log.push('update', x)"></span>`;
  let state = sprae(el, { log: [], x: 1 });
  is(state.log, ['init', 1, 'update', 1]);
  state.x = 2;
  await tick(1);
  is(state.log, ['init', 1, 'update', 1, 'update', 2]);
});
