import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'

const isJessie = globalThis.process?.env?.SPRAE_COMPILER === 'jessie'

test("fx: effects", async () => {
  let el = h`<x :fx="() => (_log.push(x), () => (console.log('out',_log), _log.push('out')))"></x>`;
  let x = signal(1)
  let state = sprae(el, { _log: [], x, console });
  is(el.outerHTML, `<x></x>`);
  await tick()
  is(state._log, [1])
  console.log('----- x=2')
  x.value = 2
  await tick()
  is(el.outerHTML, `<x></x>`);
  is(state._log, [1, 'out', 2])
  console.log('----- dispose')
  el[Symbol.dispose]()
  await tick()
  is(state._log, [1, 'out', 2, 'out'])
});

test("fx: statement side-effect", async () => {
  let el = h`<x :fx="log.push(count)"></x>`;
  let state = sprae(el, { log: [], count: 1 });
  is(state.log, [1]);
  state.count = 2;
  await tick();
  is(state.log, [1, 2]);
});

test("fx: cleanup on conditional removal", async () => {
  let el = h`<div><x :if="show" :fx="() => (log.push('on'), () => log.push('off'))"></x></div>`;
  let state = sprae(el, { show: true, log: [] });
  await tick();
  is(state.log, ['on']);

  state.show = false;
  await tick(2);
  is(state.log, ['on', 'off']);

  state.show = true;
  await tick();
  is(state.log, ['on', 'off', 'on']);
});

test("fx: async effect", { skip: isJessie }, async () => {
  let el = h`<x :fx="Promise.resolve(42).then(v => log.push(v))"></x>`;
  let state = sprae(el, { log: [] });
  await time(10);
  is(state.log, [42]);
});
