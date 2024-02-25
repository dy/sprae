// import { signal, effect, computed, batch, untracked } from "@preact/signals-core";
// import { signal, effect, computed, batch } from "@webreflection/signal";
// import { signal, effect, computed, batch } from "usignal";


// Bare minimum signals

let current // current fx

export const untracked = (fn, prev) => (prev = current, current = null, fn(), current = prev)

export const batch = (fn) => fn()

export const signal = v => {
  let obs = new Set, s = {
    get value() {
      // subscribe current effect to this signal
      current?.add(s);
      return v
    },
    set value(val) {
      v = val
      // notify effects (clear old effects since will be rebound)
      let entries = [...obs]; obs.clear()
      for (let sub of entries) sub(val)
    },

    peek() { return v },

    [Symbol.observable ||= Symbol.for('observable')]() { return s },

    subscribe(fn) {
      obs.add(fn);
      if (!current) fn(v) // immediate invoke only if not in effect
      return () => obs.delete(fn)
    }
  }
  s.toJSON = s.then = s.toString = s.valueOf = () => s.value;
  return s
};

export const effect = fn => {
  let deps = new Set, teardown, prev,
    run = () => {
      if (teardown?.call) teardown()
      prev = current, current = deps
      teardown = fn()
      for (let s of deps) s.subscribe(run)
      current = prev
    }

  run()
  return () => { for (let dep of deps) dep.delete(run) }
}

export const computed = (fn) => {
  let s = signal()
  return {
    subscribe: s.subscribe,
    dispose: effect(() => s.value = fn()),
    get value() {
      return s.value
    }
  }
};
