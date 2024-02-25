// Bare minimum signals impl
// (sorry for being a smart ass)

let current

export const untracked = (fn, prev) => (prev = current, current = null, fn(), current = prev)

export const batch = (fn) => fn()

export const signal = (v, obs, s) => (
  obs = new Set,
  s = {
    get value() {
      if (current) current.add(obs.add(current.f)) // subscribe current fx
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
)

export const effect = (fn, teardown, deps) => (
  ((deps = new Set).f = (prev) => {
    teardown?.call?.()
    prev = current, current = deps
    try { teardown = fn() } finally { current = prev }
  })(),
  () => { for (let obs of deps) obs.delete(deps.f) }
)

export const computed = (fn, s, e, init) => (
  s = signal(), init = () => e = effect(() => s.value = fn()),
  {
    get value() {
      if (!e) init()
      return s.value
    }
  }
);
