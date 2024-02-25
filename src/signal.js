// Bare minimum signals

let current // current fx

export const untracked = (fn, prev) => (prev = current, current = null, fn(), current = prev)

export const batch = (fn) => fn()

export const signal = v => {
  let obs = new Set, s = {
    get value() {
      current?.add(s); // subscribe current effect to this signal
      return v
    },
    set value(val) {
      v = val
      for (let sub of obs) sub(val) // notify effects
    },

    peek() { return v },

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
    get value() { return s.value }
  }
};
