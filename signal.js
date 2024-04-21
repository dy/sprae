// signals adapter - allows switching signals implementation and not depend on core
export let signal, effect, untracked, batch, computed;

export function use(s) {
  signal = s.signal
  effect = s.effect
  computed = s.computed
  batch = s.batch || (fn => fn())
  untracked = s.untracked || batch
}
