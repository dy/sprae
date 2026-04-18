/**
 * @fileoverview Signals-powered reactive proxy store
 * @module sprae/store
 */

import { signal, computed, batch, untracked } from './core.js'

/** Symbol for accessing the internal signals map */
export const _signals = Symbol('signals')

/** Symbol for the change signal that tracks object keys or array length */
export const _change = Symbol('change')

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

  // ignore globals
  // FIXME: handle via has trap
  if (values[Symbol.toStringTag]) return values;

  // bypass existing store
  if (values[_signals]) return values

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
    get: (_, k) => {
      if (k in signals) {
        // raw methods (no prototype) - bind to state for consistent `this`
        if (signals.hasOwnProperty(k) && typeof signals[k] === 'function' && !signals[k].prototype) return signals[k].bind(state)
        return (signals[k] ? signals[k].valueOf() : signals[k])
      }
      if (parent) {
        return parent[k]
      }
      return (typeof globalThis[k] === 'function' && !globalThis[k].prototype ? globalThis[k].bind(globalThis) : globalThis[k])
    },

    set: (_, k, v) => {
      // console.group('SET', k, v)
      if (k in signals) return set(signals, k, v), 1

      // turn off sandbox to check if parents have the prop - we don't want to create new prop in global scope
      sandbox = false

      // write transparency for parent scope, unlike prototype chain
      // if prop is defined in parent scope (except global) - write there
      if (parent && k in parent) {
        parent[k] = v
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
    mut = fn => function () { isMut = true; return fn.apply(this, arguments); },

    length = signal(values.length),

    // proxy passes prop access to signals
    state = new Proxy(
      Object.assign(signals, {
        [_change]: length,
        [_signals]: signals,
        // patch mutators
        push: mut(signals.push),
        pop: mut(signals.pop),
        shift: mut(signals.shift),
        unshift: mut(signals.unshift),
        splice: mut(signals.splice),
      }),
      {
        get(_, k) {
          // console.log('GET', k, isMut)

          // if .length is read within mutators - peek signal to avoid recursive subscription
          // we need to ignore it only once and keep for the rest of the mutator call
          if (k === 'length') return isMut ? (isMut = false, signals.length) : length.value;

          // non-numeric
          if (typeof k === 'symbol' || isNaN(k)) return signals[k]?.valueOf() ?? parent[k];

          // signals are eagerly initialized; null slots from .length extension default to undefined
          return (signals[k] ??= signal(undefined)).valueOf()
        },

        set(_, k, v) {
          // console.log('SET', k, v)

          // .length
          if (k === 'length') {
            // force cleaning up tail
            for (let i = v; i < signals.length; i++) delete state[i]
            // .length = N directly
            length.value = signals.length = v;
          }

          // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
          else if (k >= signals.length) create(signals, k, v, shallow), state.length = +k + 1

          // existing signal
          else signals[k] ? set(signals, k, v, shallow) : create(signals, k, v, shallow)

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
  let ver = signal(0)
  return new Proxy(v, {
    get: (t, k) => k === _signals ? t : k === _change ? ver : (ver.value, t[k]),
    set: (t, k, val) => { let prev = t[k]; t[k] = val; if (prev !== val) ver.value++; return 1 },
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
  if (Array.isArray(v) && Array.isArray(_v)) {
    if (_change in _v) untracked(() => batch(() => { for (let i = 0; i < v.length; i++) _v[i] = v[i]; _v.length = v.length }))
    else _s.value = _change in v ? v : list(v)
  }
  else _s.value = wrap(v)
}

export default store
