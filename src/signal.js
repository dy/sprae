// Bare minimum signals impl

let current // current fx

export const untracked = (fn, prev) => (prev = current, current = null, fn(), current = prev)

export const batch = (fn) => fn()

export const signal = (v, s, obs = new Set) => (
  s = {
    get value() {
      current?.deps.push(obs.add(current));
      return v
    },
    set value(val) {
      v = val
      for (let sub of obs) sub(val) // notify effects
    },
    peek() { return v },
  },
  s.toJSON = s.then = s.toString = s.valueOf = () => s.value,
  s
);

export const effect = (fn, teardown, run, deps) => (
  run = (prev) => {
    if (teardown?.call) teardown()
    prev = current, current = run
    try { teardown = fn() } finally { current = prev }
  },
  deps = run.deps = [],

  run(),
  (dep) => { while (dep = deps.pop()) dep.delete(run) }
)

export const computed = (fn, s = signal(), c, e) => (
  c = {
    get value() {
      e ||= effect(() => s.value = fn())
      return s.value
    }
  },
  c.toJSON = c.then = c.toString = c.valueOf = () => c.value,
  c
);
