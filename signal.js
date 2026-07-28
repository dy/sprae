/**
 * @fileoverview Minimal signals implementation (preact-signals compatible)
 * @module sprae/signal
 */

/** @type {import('./core.js').EffectFn | null} */
let current

let depth = 0

/** Monotonic effect-run id — lets signals skip re-subscribing an unchanged reader */
let run = 0

/** @type {Set<import('./core.js').EffectFn> | null} */
let batched;

// class keeps instances light: prototype accessors share one shape, subscribers Set allocates lazily
class Signal {
  constructor(v) { this.v = v; this.o = null; this.le = null; this.lr = 0 }
  get value() {
    // le/lr: last reader + its run — a re-run of the same sole reader skips the Set bookkeeping
    // (signals with one subscriber — every per-row item/field signal — hit this on each effect re-run)
    if (current && (this.le !== current || this.lr !== current.r)) {
      current.deps.add((this.o ??= new Set).add(current))
      this.le = current; this.lr = current.r
    }
    return this.v
  }
  set value(val) {
    if (val === this.v) return
    this.v = val
    if (this.o) for (let sub of this.o) batched ? batched.add(sub) : sub() // notify effects
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
export const effect = (fn, _teardown, _fx, _deps) => (
  _fx = (prev) => {
    if (!fn) return // disposed during batch flush
    let tmp = _teardown;
    _teardown = null;
    tmp?.call?.();
    prev = current, current = _fx, _fx.r = ++run
    if (depth++ > 50) {
      depth--; current = prev;
      // dispose: unsubscribe from all deps so this effect never fires again
      _teardown = fn = _fx.fn = null; for (let dep of _deps) dep.delete(_fx); _deps.clear()
      console.error('∴ Reactive loop detected'); return
    }
    try { _teardown = fn() } finally { current = prev; depth-- }
  },
  _fx.fn = fn,
  _deps = _fx.deps = new Set(),

  _fx(),
  (dep) => { _teardown?.call?.(); _teardown = fn = _fx.fn = null; for (dep of _deps) dep.delete(_fx); _deps.clear() }
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
