/**
 * @fileoverview Signals-powered reactive proxy store
 * @module sprae/store
 */

import { signal, computed, batch, untracked } from './core.js'

/** Symbol for accessing the internal signals map */
export const _signals = Symbol('signals')

/** Symbol for the change signal that tracks object keys or array length */
export const _change = Symbol('change')

/** Symbol for list index/content bumps (swap, splice, index writes) */
export const _touch = Symbol('touch')

/** Symbol for stashed setter on computed values */
export const _set = Symbol('set')

/** Symbol for parent scope link */
const _parent = Symbol('parent')

// a hack to simulate sandbox for `with` in evaluator
let sandbox = true

/**
 * Reactive store with signals backing.
 * @template T
 * @typedef {T & { [_signals]: Record<string | symbol, import('./core.js').Signal<any>> }} ReactiveStore
 */

/**
 * Creates a reactive proxy store from an object or array.
 * Properties become signals for fine-grained reactivity.
 * Supports nested objects, arrays, computed getters, and methods.
 *
 * @template {Object} T
 * @param {T} values - Initial values object
 * @param {Object} [parent] - Parent scope for inheritance
 * @returns {ReactiveStore<T>} Reactive proxy store
 *
 * @example
 * const state = store({ count: 0, get doubled() { return this.count * 2 } })
 * state.count = 5  // triggers updates
 * state.doubled    // 10 (computed)
 */
export const store = (values, parent) => {
  if (!values) return values

  // bypass existing store (first: cheapest probe on row/store proxies — per :each row)
  if (values[_signals]) return values

  // ignore globals
  // FIXME: handle via has trap
  if (values[Symbol.toStringTag]) return values;

  // non-objects: for array redirect to list
  if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values

  // _change stores total number of keys to track new props
  let keyCount = Object.keys(values).length,
    signals = {}

  // proxy conducts prop access to signals
  let state = new Proxy(Object.assign(signals, {
    [_change]: signal(keyCount),
    [_signals]: signals,
  }), {
    get: (_, k, s) => {
      if ((s = signals[k]) !== undefined || k in signals) {
        // raw methods (no prototype) - bind to state for consistent `this`
        if (typeof s === 'function' && !s.prototype && signals.hasOwnProperty(k)) return s.bind(state)
        return (s ? s.valueOf() : s)
      }
      // Symbol.unscopables: `with` fetches it per identifier per eval — answer the miss before parent/global walk
      if (k === Symbol.unscopables) return
      if (parent) {
        return parent[k]
      }
      return (typeof globalThis[k] === 'function' && !globalThis[k].prototype ? globalThis[k].bind(globalThis) : globalThis[k])
    },

    set: (_, k, v, receiver) => {
      // console.group('SET', k, v)
      if (k in signals) return set(signals, k, v), 1

      // turn off sandbox to check if parents have the prop - we don't want to create new prop in global scope
      sandbox = false

      // write transparency for parent scope, unlike prototype chain
      // if prop is defined in parent scope (except global) - write there
      if (parent && k in parent) {
        parent[k] = v
      }
      // prototype-chained scope (:each row): unknown prop becomes a local on the scope, not a state prop
      else if (receiver !== state && receiver !== undefined) {
        Reflect.defineProperty(receiver, k, { value: v, writable: true, enumerable: true, configurable: true })
      }
      // else create in current scope
      else {
        create(signals, k, v)
        signals[_change].value = ++keyCount
      }

      sandbox = true

      // console.groupEnd()
      // bump length for new signal
      return 1
    },

    // FIXME: try to avild calling Symbol.dispose here. Maybe _delete method?
    deleteProperty: (_, k) => {
      k in signals && (k[0] != '_' && signals[k]?.[Symbol.dispose]?.(), delete signals[k], signals[_change].value = --keyCount)
      return 1
    },

    // subscribe to length when spreading
    ownKeys: () => (signals[_change].value, Reflect.ownKeys(signals).filter(k => k !== _parent)),

    // sandbox prevents writing to global
    has: (_, k) => {
      if (k in signals) return true
      if (parent) return k in parent
      return sandbox
    }
  })
  Object.defineProperty(signals, _parent, { value: parent, configurable: true })

  // init signals for values
  const descs = Object.getOwnPropertyDescriptors(values)

  for (let k in values) {
    // getter turns into computed
    if (descs[k]?.get)
      // stash setter
      (signals[k] = computed(descs[k].get.bind(state)))[_set] = descs[k].set?.bind(state);

    // init blank signal - make sure we don't take prototype one
    else create(signals, k, values[k])
  }

  return state
}

/**
 * Creates a reactive array store with lazy signal initialization.
 * Arrays can be large, so signals are created on-demand.
 * @param {any[]} values - Initial array values
 * @param {Object} [parent=globalThis] - Parent scope
 * @returns {ReactiveStore<any[]>} Reactive array proxy
 */
const list = (values, parent = globalThis) => {

  // init signals eagerly — shallow() is cheap (1 Proxy + 1 signal per object item)
  let signals = values.map(v => signal(shallow(v))),

    // if .length was accessed from mutator (.push/etc) method
    isMut = false,

    // since array mutator methods read .length internally only once, we disable it on the moment of call, allowing rest of operations to be reactive
    // batch: a single splice/push writes many index signals — notify subscribers once, not per index
    mut = fn => function () { isMut = true; let r; batch(() => r = fn.apply(this, arguments)); return r },

    length = signal(values.length),

    // _touch bumps notify keyed :each of index/content changes (swap, splice) in O(1)
    // instead of forcing :each to subscribe to all N index signals
    touch = signal(0),
    bump = () => { touch.value++ },

    // capture native array mutators before they're shadowed on signals[]
    asplice = signals.splice,

    // proxy passes prop access to signals
    state = new Proxy(
      Object.assign(signals, {
        [_change]: length,
        [_touch]: touch,
        [_signals]: signals,
        // append directly: create signals in place, one length notify — per-index proxy traps are pure overhead
        push(...items) {
          let r
          batch(() => {
            for (let v of items) create(signals, signals.length, v, shallow)
            r = length.value = signals.length
          })
          return r
        },
        // patch mutators — `this` must be the list proxy so set traps fire reactively
        pop: mut(signals.pop),
        shift: mut(signals.shift),
        unshift: mut(signals.unshift),
        splice: mut(function () { let r = asplice.apply(this, arguments); bump(); return r }),
      }),
      {
        get(_, k) {
          // console.log('GET', k, isMut)

          // if .length is read within mutators - peek signal to avoid recursive subscription
          // we need to ignore it only once and keep for the rest of the mutator call
          if (k === 'length') return isMut ? (isMut = false, signals.length) : length.value;

          // non-numeric
          if (typeof k === 'symbol' || isNaN(k)) return signals[k]?.valueOf() ?? parent[k];

          // out of range: depend on length (growth re-runs the reader) — a lazy slot here would
          // extend the raw array and desync it from the length signal, corrupting later mutators
          if (+k >= signals.length) return length.value, undefined

          // signals are eagerly initialized; null slots from .length extension default to undefined
          return (signals[k] ??= signal(undefined)).valueOf()
        },

        set(_, k, v) {
          // console.log('SET', k, v)

          // .length
          if (k === 'length') {
            // clean up tail directly — proxy delete per index is pure trap overhead
            for (let i = v; i < signals.length; i++) signals[i]?.[Symbol.dispose]?.()
            // .length = N directly
            length.value = signals.length = v;
          }

          // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
          else if (k >= signals.length) create(signals, k, v, shallow), state.length = +k + 1

          // existing signal — bump for :each index tracking (swap)
          else if (signals[k]) {
            let s = signals[k], prev = s.peek?.() ?? s.valueOf()
            set(signals, k, v, shallow)
            if ((s.peek?.() ?? s.valueOf()) !== prev) bump()
          } else create(signals, k, v, shallow)

          return 1
        },

        // dispose notifies any signal deps, like :each
        deleteProperty: (_, k) => (signals[k]?.[Symbol.dispose]?.(), delete signals[k], 1),
      })
  Object.defineProperty(signals, _parent, { value: parent, configurable: true })

  return state
}

/**
 * Creates a signal for a property value.
 * Skips wrapping for untracked props (underscore prefix), existing signals, and functions.
 * @param {Object} signals - Signals storage object
 * @param {string} k - Property key
 * @param {any} v - Property value
 */
const create = (signals, k, v, wrap = store) => (signals[k] = (k[0] == '_' || v?.peek || typeof v === 'function') ? v : signal(wrap(v)))

/** Lightweight reactive wrapper for array items — avoids full store() per item. */
const shallow = (v) => {
  if (!v || typeof v !== 'object' || v.constructor !== Object) return v
  if (v[_change]) return v // already reactive (store or shallow proxy)
  // per-key version signals: writing one key notifies only its readers, not the whole item
  let sigs = {}, ver // ver tracks key set (adds/deletes), created on demand
  return new Proxy(v, {
    get: (t, k) => k === _signals ? t : k === _change ? (ver ??= signal(0)) : typeof k === 'symbol' ? t[k] : ((sigs[k] ??= signal(0)).value, t[k]),
    set: (t, k, val) => {
      if (t[k] !== val) {
        let fresh = !(k in t)
        t[k] = val
        sigs[k] && sigs[k].value++
        if (fresh && ver) ver.value++
      }
      return 1
    },
    has: () => true
  })
}

/**
 * Updates a signal value, handling arrays specially for efficient patching.
 * @param {Object} signals - Signals storage object
 * @param {string} k - Property key
 * @param {any} v - New value
 */
const set = (signals, k, v, wrap = store) => {
  if (k[0] === '_' || typeof signals[k] === 'function') return (signals[k] = v)
  let _s = signals[k], _v = _s.peek?.() ?? _s
  if (v === _v) return
  // stashed _set for value with getter/setter
  if (_s[_set]) return _s[_set](v)
  // patch store array in-place to preserve identity (avoids reactive loops when an effect reads + writes same prop)
  // direct signal writes with one touch/length notify — per-index proxy traps are pure overhead
  if (Array.isArray(v) && Array.isArray(_v)) {
    if (_change in _v) untracked(() => batch(() => {
      let sigs = _v[_signals], n = sigs.length, m = v.length, changed = 0, i = 0, s, prev
      for (; i < m && i < n; i++) {
        s = sigs[i], prev = s?.peek ? s.peek() : s
        set(sigs, i, v[i], shallow)
        s = sigs[i]
        if ((s?.peek ? s.peek() : s) !== prev) changed = 1
      }
      for (; i < m; i++) create(sigs, i, v[i], shallow)
      if (m < n) { for (; i < n; i++) sigs[i]?.[Symbol.dispose]?.(); sigs.length = m }
      if (changed) sigs[_touch].value++
      if (m !== n) sigs[_change].value = m
    }))
    else _s.value = _change in v ? v : list(v)
  }
  else _s.value = wrap(v)
}

export default store
