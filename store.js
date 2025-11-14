// signals-based proxy
import { signal, computed, batch, untracked } from './core.js'


// _signals allows both storing signals and checking instance, which would be difficult with WeakMap
export const _signals = Symbol('signals'),
  // _change is a signal that tracks changes to the object keys or array length
  _change = Symbol('change'),
  // _set is stashed setter for computed values
  _set = Symbol('set')

// a hack to simulate sandbox for `with` in evaluator
let sandbox = true

// object store is not lazy
// parent defines parent scope or sandbox
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
    [_signals]: signals
  }), {
    get: (_, k) => {
      // console.log('GET', k, signals)
      if (k in signals) return (signals[k] ? signals[k].valueOf() : signals[k])
      return parent ? parent[k] : globalThis[k]
    },

    set: (_, k, v, _s) => {
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
    ownKeys: () => (signals[_change].value, Reflect.ownKeys(signals)),

    // sandbox prevents writing to global
    has: (_, k) => {
      if (k in signals) return true
      if (parent) return k in parent
      return sandbox
    }
  })

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

// array store - signals are lazy since arrays can be very large & expensive
const list = (values, parent = globalThis) => {

  // gotta fill with null since proto methods like .reduce may fail
  let signals = Array(values.length).fill(null),

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

          // create signal (lazy)
          // NOTE: if you decide to unlazy values, think about large arrays - init upfront can be costly
          return (signals[k] ??= signal(store(values[k]))).valueOf()
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
          else if (k >= signals.length) create(signals, k, v), state.length = +k + 1

          // existing signal
          else signals[k] ? set(signals, k, v) : create(signals, k, v)

          return 1
        },

        // dispose notifies any signal deps, like :each
        deleteProperty: (_, k) => (signals[k]?.[Symbol.dispose]?.(), delete signals[k], 1),
      })

  return state
}

// create signal value, skip untracked
const create = (signals, k, v) => (signals[k] = (k[0] == '_' || v?.peek) ? v : signal(store(v)))

// set/update signal value
const set = (signals, k, v, _s, _v) => {
  // skip unchanged (although can be handled by last condition - we skip a few checks this way)
  return k[0] === '_' ? (signals[k] = v) :
    (v !== (_v = (_s = signals[k]).peek())) && (
      // stashed _set for value with getter/setter
      _s[_set] ? _s[_set](v) :
        // patch array
        Array.isArray(v) && Array.isArray(_v) ?
          // if we update plain array (stored in signal) - take over value instead
          // since input value can be store, we have to make sure we don't subscribe to its length or values
          // FIXME: generalize to objects
          _change in _v ?
            untracked(() => batch(() => {
              for (let i = 0; i < v.length; i++) _v[i] = v[i]
              _v.length = v.length // forces deleting tail signals
            })) :
            (_s.value = v) :
          // .x = y
          (_s.value = store(v))
    )
}


// make sure state contains first element of path, eg. `a` from `a.b[c]`
// NOTE: we don't need since we force proxy sandbox
// export const ensure = (state, expr, _name = expr.match(/^\w+(?=\s*(?:\.|\[|$))/)) => _name && (state[_signals][_name[0]] ??= null)

export default store
