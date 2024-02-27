// Minimorum signals impl (almost like ulive but smaller)
export let current,
  signal = (v, s, obs = new Set) => (
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
  ),
  effect = (fn, teardown, run, deps) => (
    run = (prev) => {
      if (teardown?.call) teardown()
      prev = current, current = run
      try { teardown = fn() } finally { current = prev }
    },
    deps = run.deps = [],

    run(),
    (dep) => { while (dep = deps.pop()) dep.delete(run) }
  ),
  computed = (fn, s = signal(), c, e) => (
    c = {
      get value() {
        e ||= effect(() => s.value = fn())
        return s.value
      }
    },
    c.toJSON = c.then = c.toString = c.valueOf = () => c.value,
    c
  ),
  batch = (fn) => fn(),
  untracked = (fn, prev, v) => (prev = current, current = null, v = fn(), current = prev, v)
