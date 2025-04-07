// signals-based proxy
import { signal, computed, batch } from './signal.js'
import { parse } from './core.js';

export const _signals = Symbol('signals'),
    _change = Symbol('change'),
    _stash = '__',

  // object store is not lazy
  store = (values, parent) => {
    if (!values) return values

    // ignore existing state as argument or globals
    if (values[_signals] || values[Symbol.toStringTag]) return values;

    // non-objects: for array redirect to list
    if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values

    let signals = { ...parent?.[_signals] },
        _len = signal(Object.keys(values).length),
        stash,

      // proxy conducts prop access to signals
      state = new Proxy(signals, {
        get: (_, k) => k === _change ? _len : k === _signals ? signals : k === _stash ? stash : signals[k]?.valueOf(),
        set: (_, k, v, s) => (k === _stash ? stash = v : s = k in signals, set(signals, k, v), s || ++_len.value), // bump length for new signal
        deleteProperty: (_, k) => (signals[k] && (signals[k][Symbol.dispose]?.(), delete signals[k], _len.value--), 1),
        // subscribe to length when object is spread
        ownKeys: () => (_len.value, Reflect.ownKeys(signals)),
      }),

      // init signals for values
      descs = Object.getOwnPropertyDescriptors(values)

    for (let k in values) {
      // getter turns into computed
      if (descs[k]?.get)
        // stash setter
        (signals[k] = computed(descs[k].get.bind(state)))._set = descs[k].set?.bind(state);

      else
        // init blank signal - make sure we don't take prototype one
        signals[k] = null, set(signals, k, values[k]);
    }

    return state
  },

  // array store - signals are lazy since arrays can be very large & expensive
  list = values => {
    // track last accessed property to find out if .length was directly accessed from expression or via .push/etc method
    let lastProp,

      // .length signal is stored separately, since it cannot be replaced on array
      _len = signal(values.length),

      // gotta fill with null since proto methods like .reduce may fail
      signals = Array(values.length).fill(),

      // proxy conducts prop access to signals
      state = new Proxy(signals, {
        get(_, k) {
          // covers Symbol.isConcatSpreadable etc.
          if (typeof k === 'symbol') return k === _change ? _len : k === _signals ? signals : signals[k]

          // if .length is read within .push/etc - peek signal to avoid recursive subscription
          if (k === 'length') return mut.includes(lastProp) ? _len.peek() : _len.value;

          lastProp = k;

          // create signal (lazy)
          // NOTE: if you decide to unlazy values, think about large arrays - init upfront can be costly
          return (signals[k] ?? (signals[k] = signal(store(values[k])))).valueOf()
        },

        set(_, k, v) {
          // .length
          if (k === 'length') {
            // force cleaning up tail
            for (let i = v; i < signals.length; i++) delete state[i]
            // .length = N directly
            _len.value = signals.length = v;
          }
          else {
            set(signals, k, v)

            // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
            if (k >= _len.peek()) _len.value = signals.length = +k + 1
          }

          return 1
        },

        deleteProperty: (_, k) => (signals[k]?.[Symbol.dispose]?.(), delete signals[k], 1),
      })

    return state
  }

// length changing methods
const mut = ['push', 'pop', 'shift', 'unshift', 'splice']

// set/update signal value
const set = (signals, k, v) => {
  let s = signals[k], cur

  // untracked
  if (k[0] === '_') signals[k] = v
  // new property. preserve signal value as is
  else if (!s) signals[k] = s = v?.peek ? v : signal(store(v))
  // skip unchanged (although can be handled by last condition - we skip a few checks this way)
  else if (v === (cur = s.peek()));
  // stashed _set for value with getter/setter
  else if (s._set) s._set(v)
  // patch array
  else if (Array.isArray(v) && Array.isArray(cur)) {
    // if we update plain array (stored in signal) - take over value instead
    if (cur[_change]) batch(() => {
      for (let i = 0; i < v.length; i++) cur[i] = v[i]
      cur.length = v.length // forces deleting tail signals
    })
    else s.value = v
  }
  // .x = y
  else s.value = store(v)
}

// create expression setter, reflecting value back to state
export const setter = (expr, set = parse(`${expr}=${_stash}`)) => (
  (state, value) => (
    state[_stash] = value, // save value to stash
    set(state)
  )
)

// make sure state contains first element of path, eg. `a` from `a.b[c]`
export const ensure = (state, expr, name = expr.match(/^\w+(?=\s*(?:\.|\[|$))/)) => name && (state[_signals][name[0]] ??= null)

export default store
