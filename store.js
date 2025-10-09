// signals-based proxy
import { signal, computed, batch, untracked } from './core.js'


// _signals allows both storing signals and checking instance, which would be difficult with WeakMap
export const _signals = Symbol('signals'),
  _change = Symbol('change'),
  _set = Symbol('set')

// object store is not lazy
// parent defines parent scope or sandbox
export const store = (values, parent = globalThis) => {
  if (!values) return values

  // ignore existing state as argument or globals
  // FIXME: toStringTag is not needed since we read global as parent (can remove this condition)
  if (values[Symbol.toStringTag]) return values;

  // bypass existing store
  if (values[_signals]) return values

  // non-objects: for array redirect to list
  if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values

  // _change stores total number of keys to track new props
  // NOTE: be careful
  let keyCount = Object.keys(values).length,
      signals = {  }

  // proxy conducts prop access to signals
  let state = new Proxy(Object.assign(signals, {[_change]: signal(keyCount), [_signals]: signals}), {
    get: (_, k) => (k in signals ? (signals[k] ? signals[k].valueOf() : signals[k]) : parent[k]),
    set: (_, k, v, _s) => (k in signals ? set(signals, k, v) : (create(signals, k, v), signals[_change].value = ++keyCount), 1), // bump length for new signal
    // FIXME: try to avild calling Symbol.dispose here
    deleteProperty: (_, k) => (k in signals && (k[0] != '_' && signals[k]?.[Symbol.dispose]?.(), delete signals[k], signals[_change].value = --keyCount), 1),
    // subscribe to length when object is spread
    ownKeys: () => (signals[_change].value, Reflect.ownKeys(signals)),
    has: _ => 1 // sandbox prevents writing to global
  }),

    // init signals for values
    descs = Object.getOwnPropertyDescriptors(values)

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

const mut = ['push', 'pop', 'shift', 'unshift', 'splice']

// array store - signals are lazy since arrays can be very large & expensive
const list = (values, parent = globalThis) => {

  // gotta fill with null since proto methods like .reduce may fail
  let signals = Array(values.length).fill(null),

    // if .length was accessed from mutator (.push/etc) method
    isMut = false,

    // create mutator which marks isMut during call
    mutator = fn => function () {isMut = true; console.group('mut', fn.name); let result = fn.apply(this, arguments); console.groupEnd(); isMut = false; return result},

    length = signal(values.length),

    // proxy conducts prop access to signals
    state = new Proxy(
      Object.assign(signals, {
        [_change]: length,
        [_signals]: signals,
        push: mutator(signals.push),
        pop: mutator(signals.pop),
        shift: mutator(signals.shift),
        unshift: mutator(signals.unshift),
        splice: mutator(signals.splice),
      }),
      {
        get(_, k) {
          // console.log('GET', k, isMut)

          // if .length is read within mutators - peek signal to avoid recursive subscription
          if (k === 'length') return isMut ? signals.length : length.value;

          // create signal (lazy)
          // NOTE: if you decide to unlazy values, think about large arrays - init upfront can be costly
          // return (signals[k] ? (signals[k].valueOf()) : k in signals ? (signals[k] = signal(store(values[k]))).valueOf() : parent[k])

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
const create = (signals, k, v) => (signals[k] = k[0] == '_' || v?.peek ? v : signal(store(v)))

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
          _change in _v ? untracked(() => batch(() => {
            for (let i = 0; i < v.length; i++) _v[i] = v[i]
            _v.length = v.length // forces deleting tail signals
          })) : _s.value = v :
          // .x = y
          (_s.value = store(v))
    )
}


// make sure state contains first element of path, eg. `a` from `a.b[c]`
// NOTE: we don't need since we force proxy sandbox
// export const ensure = (state, expr, name = expr.match(/^\w+(?=\s*(?:\.|\[|$))/)) => name && (state[_signals][name[0]] ??= null)

export default store
