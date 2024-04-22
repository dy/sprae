// signals-based proxy
import { signal, computed, effect, batch, untracked } from './signal.js'

export const _signals = Symbol('signals'), _change = Symbol('length');

// track last accessed property to find out if .length was directly accessed from expression or via .push/etc method
let lastProp

export default function createState(values, parent) {
  const isArr = Array.isArray(values)

  if (!values || (values?.constructor !== Object && !isArr)) return values;

  // ignore existing state as argument
  if (values[_signals] && !parent) return values;

  const initSignals = values[_signals],

    // .length signal is stored outside, since it cannot be replaced
    // _len stores total values length (for objects as well)
    _len = signal(isArr ? values.length : Object.values(values).length),

    // dict with signals storing values
    signals = parent ? Object.create((parent = createState(parent))[_signals]) : isArr ? [] : {},
    proto = signals.constructor.prototype;

  if (parent) for (let key in parent) parent[key] // touch parent keys

  // proxy conducts prop access to signals
  const state = new Proxy(values, {
    // FIXME: instead of redefining this we can adjust :scope directive
    has(values, key) { return key in signals },

    get(values, key) {
      // if .length is read within .push/etc - peek signal (don't subscribe)
      if (isArr)
        if (key === 'length') return (proto[lastProp]) ? _len.peek() : _len.value;
        else lastProp = key;
      // standard methods
      if (proto[key]) return proto[key]
      if (key === _signals) return signals
      if (key === _change) return _len.value
      const s = signals[key] || initSignal(key)
      return s?.value // existing property
    },

    set(values, key, v) {
      // console.log('set', key, v)
      if (isArr) {
        // .length
        if (key === 'length') {
          // batch(() => {
          // force cleaning up tail
          for (let i = v, l = signals.length; i < l; i++) delete state[i]
          _len.value = signals.length = values.length = v;
          // })
          return true
        }
      }

      let newProp = false,
        s = signals[key] || initSignal(key) || (newProp = true, signal()),
        cur = s.peek()

      // skip unchanged (although can be handled by last condition - we skip a few checks this way)
      if (v === cur);
      // stashed _set for values with getter/setter
      else if (s._set) s._set(v)
      // patch array
      else if (Array.isArray(v) && Array.isArray(cur)) {
        untracked(() => {
          batch(() => {
            let i = 0, l = v.length, vals = values[key];
            for (; i < l; i++) cur[i] = vals[i] = v[i]
            cur.length = l // forces deleting tail signals
          })
        })
      }
      // .x = y
      else {
        // reflect change in values
        s.value = createState(values[key] = v)
      }

      // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
      if (isArr) {
        if (key >= _len.peek()) _len.value = signals.length = values.length = Number(key) + 1
      }
      // bump _change for object
      else if (newProp) {
        _len.value++
      }

      return true
    },

    deleteProperty(values, key) {
      const s = signals[key]
      if (s) {
        const { _del } = s
        delete s._del
        delete signals[key]
        _del?.()
      }
      delete values[key]
      if (!isArr && _len.value) _len.value--
      return true
    }
  })

  // init signals placeholders (instead of ownKeys & getOwnPropertyDescriptor handlers)
  // if values are existing proxy (in case of extending parent) - take its signals instead of creating new ones
  for (let key in values) signals[key] = initSignals?.[key] ?? initSignal(key);

  // initialize signal for provided key
  function initSignal(key) {
    // init existing value
    if (values.hasOwnProperty(key)) {
      // create signal from descriptor
      const desc = Object.getOwnPropertyDescriptor(values, key)

      // getter turns into computed
      if (desc?.get) {
        // stash setter
        (signals[key] = computed(desc.get.bind(state)))._set = desc.set?.bind(state);
        return signals[key]
      }

      // take over existing signal or create new signal
      return signals[key] = desc.value?.peek ? desc.value : signal(createState(desc.value))
    }
  }

  return state
}
