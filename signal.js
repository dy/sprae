// ulive minimal signal impl (decoupled from ulive to keep internal dep adjustable easily)
let current

export const signal = (v, s, obs = new Set) => (
  s = {
    get value() {
      current?.deps.push(obs.add(current));
      return v
    },
    set value(val) {
      if (val === v) return
      v = val;
      for (let sub of obs) sub(val); // notify effects
    },
    peek() { return v },
  },
  s.toJSON = s.then = s.toString = s.valueOf = () => s.value,
  s
),
  effect = (fn, teardown, run, deps) => (
    run = (prev) => {
      teardown?.call?.();
      prev = current, current = run;
      try { teardown = fn(); } finally { current = prev; }
    },
    deps = run.deps = [],

    run(),
    (dep) => { teardown?.call?.(); while (dep = deps.pop()) dep.delete(run); }
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
  batch = (fn) => fn(),
  untracked = (fn, prev, v) => (prev = current, current = null, v = fn(), current = prev, v);
