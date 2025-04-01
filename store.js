// signals-based proxy
import { signal, computed, batch } from './signal.js'

export const _signals = Symbol('signals'), _change = Symbol('change'),

  // object store is not lazy
  store = (values, parent) => {
    if (!values) return values

    // ignore existing state as argument or globals
    if (values[_signals] || values[Symbol.toStringTag]) return values;

    // non-objects: for array redirect to list
    if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values

    // NOTE: if you decide to unlazy values, think about large arrays - init upfront can be costly
    let signals = { ...parent?.[_signals] }, _len = signal(Object.values(values).length),

      // proxy conducts prop access to signals
      state = new Proxy(signals, {
        get: (_, key) => key === _change ? _len : key === _signals ? signals : signals[key]?.valueOf(),
        set: (_, key, v, s) => (s = signals[key], set(signals, key, v), s ?? (++_len.value), 1), // bump length for new signal
        deleteProperty: (_, key) => (signals[key] && (signals[key][Symbol.dispose]?.(), delete signals[key], _len.value--), 1),
        // subscribe to length when object is spread
        ownKeys: () => (_len.value, Reflect.ownKeys(signals)),
      }),

      // init signals for values
      descs = Object.getOwnPropertyDescriptors(values),
      desc

    for (let key in values) {
      // getter turns into computed
      if ((desc = descs[key])?.get)
        // stash setter
        (signals[key] = computed(desc.get.bind(state)))._set = desc.set?.bind(state);

      else
        // init blank signal - make sure we don't take prototype one
        signals[key] = null, set(signals, key, values[key]);
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
        get(_, key) {
          // covers Symbol.isConcatSpreadable etc.
          if (typeof key === 'symbol') return key === _change ? _len : key === _signals ? signals : signals[key]

          // if .length is read within .push/etc - peek signal to avoid recursive subscription
          if (key === 'length') return mut.includes(lastProp) ? _len.peek() : _len.value;

          lastProp = key;

          if (signals[key]) return signals[key].valueOf()

          // I hope reading values here won't diverge from signals
          if (key < signals.length) return (signals[key] = signal(store(values[key]))).value
        },

        set(_, key, v) {
          // .length
          if (key === 'length') {
            // force cleaning up tail
            for (let i = v; i < signals.length; i++) delete state[i]
            // .length = N directly
            _len.value = signals.length = v;
          }
          else {
            set(signals, key, v)

            // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
            if (key >= _len.peek()) _len.value = signals.length = +key + 1
          }

          return 1
        },

        deleteProperty: (_, key) => (signals[key]?.[Symbol.dispose]?.(), delete signals[key], 1),
      })

    return state
  }

// length changing methods
const mut = ['push', 'pop', 'shift', 'unshift', 'splice']

// set/update signal value
const set = (signals, key, v) => {
  let s = signals[key], cur

  // untracked
  if (key[0] === '_') signals[key] = v
  // new property. preserve signal value as is
  else if (!s) signals[key] = s = v?.peek ? v : signal(store(v))
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

export default store
