// @preact/signals compatible wrapper for signal standard
import { Signal } from 'signal-polyfill'

const { untrack, Watcher } = Signal.subtle

export const signal = v => wrap(new Signal.State(v))
export const computed = fn => wrap(new Signal.Computed(fn))

export { untrack as untracked }

const wrap = (s) => {
  let get = () => s.get()
  Object.defineProperty(s, 'value', {
    get,
    set(v) { s.set(v) }
  })
  s.peek = () => untrack(get)
  s.toJSON = s.then = s.toString = s.valueOf = get
  return s
}


let pending = false;

let watcher = new Watcher(() => {
  if (!pending) {
    pending = true;
    queueMicrotask(() => {
      pending = false;
      for (const signal of watcher.getPending()) {
        signal.get();
        watcher.watch(signal);
      }
    });
  }
});

/**
 * ⚠️ WARNING: Nothing unwatches ⚠️
 * This will produce a memory leak.
 */
export function effect(cb) {
  let destructor;
  let c = new Signal.Computed(() => { typeof destructor === 'function' && destructor(); destructor = cb(); });
  watcher.watch(c);
  c.get();
  return () => { typeof destructor === 'function' && destructor(); watcher.unwatch(c) };
}
