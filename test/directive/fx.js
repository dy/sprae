import { tick, time } from "wait-please";
import sprae from '../../sprae.js'
import h from "hyperf";
import test, { any, is, ok } from "tst";
import { store } from '../../store.js'
import { use, signal, batch, untracked } from '../../core.js'

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
