// ulive copy, stable minimal implementation
let current;

export let signal = (v, s, obs = new Set) => (
  s = {
    get value() {
      current?.deps.push(obs.add(current));
      return v
    },
    set value(val) {
      if (val === v) return
      v = val;
      for (let sub of obs) sub(); // notify effects
    },
    peek() { return v },
  },
  s.toJSON = s.then = s.toString = s.valueOf = () => s.value,
  s
),
  effect = (fn, teardown, fx, deps) => (
    fx = (prev) => {
      teardown?.call?.();
      prev = current, current = fx;
      try { teardown = fn(); } finally { current = prev; }
    },
    deps = fx.deps = [],

    fx(),
    (dep) => { teardown?.call?.(); while (dep = deps.pop()) dep.delete(fx); }
  ),
  computed = (fn, s = signal(), c, e) => (
    c = {
      get value() {
        e ||= effect(() => s.value = fn());
        return s.value
      },
      peek: s.peek
    },
    c.toJSON = c.then = c.toString = c.valueOf = () => c.value,
    c
  ),
  batch = fn => fn(),
  untracked = batch,

  // signals adapter - allows switching signals implementation and not depend on core
  use = (s) => (
    signal = s.signal,
    effect = s.effect,
    computed = s.computed,
    batch = s.batch || batch,
    untracked = s.untracked || untracked
  )
