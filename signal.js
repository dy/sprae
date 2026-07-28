/**
 * @fileoverview Minimal signals implementation (preact-signals compatible)
 * @module sprae/signal
 */

/** @type {import('./core.js').EffectFn | null} */
let current

let depth = 0

/** @type {Set<import('./core.js').EffectFn> | null} */
let batched;

// class keeps instances light: prototype accessors share one shape. The common single-subscriber
// case stores the effect directly; a Set is allocated only when a second effect subscribes.
// Effect deps mirror the same shape: sole dep inline, Set from the second dep on.
class Signal {
  constructor(v) { this.v = v; this.o = null }
  get value() {
    let c = current, d
    // A sole subscriber re-reading its signal is already linked on both sides; skip the probes.
    if (c && this.o !== c && (d = c.deps, c.fr || !(d === this || d?.has?.(this)))) {
      // link effect → signal
      if (!d) c.deps = this
      else if (d.add) d.add(this)
      else c.deps = new Set([d, this])
      // link signal → effect
      let o = this.o
      if (!o) this.o = c
      else if (o !== c) o.add ? o.add(c) : this.o = new Set([o, c])
    }
    return this.v
  }
  set value(val) {
    if (val === this.v) return
    this.v = val
    let o = this.o
    if (o?.add) for (let sub of o) batched ? batched.add(sub) : sub()
    else if (o) batched ? batched.add(o) : o()
  }
  /** Remove an effect subscriber. */
  off(sub) {
    let o = this.o
    if (o === sub) this.o = null
    else if (o?.delete) { o.delete(sub); if (!o.size) this.o = null }
  }
  peek() { return this.v }
  valueOf() { return this.value }
  toString() { return this.value }
  toJSON() { return this.value }
}

/**
 * Creates a reactive signal.
 * @template T
 * @param {T} v - Initial value
 * @returns {import('./core.js').Signal<T>}
 */
export const signal = (v) => new Signal(v)

/**
 * Creates a reactive effect that re-runs when dependencies change.
 * @param {() => void | (() => void)} fn - Effect function, may return cleanup
 * @returns {() => void} Dispose function
 */
const unsubscribe = (fx, d = fx.deps) => {
  if (d) d.off ? d.off(fx) : (d.forEach(dep => dep.off(fx)), d.clear())
  fx.deps = null
}

export const effect = (fn, _teardown, _fx) => (
  _fx = (prev) => {
    if (!fn) return // disposed during batch flush
    let tmp = _teardown;
    _teardown = null;
    tmp?.call?.();
    prev = current, current = _fx
    if (depth++ > 50) {
      depth--; current = prev;
      // dispose: unsubscribe from all deps so this effect never fires again
      _teardown = fn = null; unsubscribe(_fx)
      console.error('∴ Reactive loop detected'); return
    }
    try { _teardown = fn() } finally { current = prev; depth-- }
  },
  _fx.deps = null,
  // fr: first run — subscriptions are all new, skip dedupe probes
  _fx.fr = 1, _fx(), _fx.fr = 0,
  () => { _teardown?.call?.(); _teardown = fn = null; unsubscribe(_fx) }
)

// a computed is a signal with a lazy producer effect keeping it current
class Computed extends Signal {
  constructor(fn) { super(); this.fn = fn; this.e = null }
  get value() {
    this.e ||= effect(() => super.value = this.fn())
    return super.value
  }
}

/**
 * Creates a computed signal derived from other signals.
 * @template T
 * @param {() => T} fn - Computation function
 * @returns {import('./core.js').Signal<T>}
 */
export const computed = (fn) => new Computed(fn)

/**
 * Batches multiple signal updates into a single notification.
 * @template T
 * @param {() => T} fn - Function containing updates
 * @returns {T}
 */
export const batch = (fn, _first = !batched, _list) => {
  batched ??= new Set;
  try { fn(); }
  finally { if (_first) { [batched, _list] = [null, batched]; for (const fx of _list) fx(); } }
}

/**
 * Runs a function without tracking dependencies.
 * @template T
 * @param {() => T} fn - Function to run untracked
 * @returns {T}
 */
export const untracked = (fn, _prev) => {
  _prev = current, current = null
  try { return fn() } finally { current = _prev }
}
