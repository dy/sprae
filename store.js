// signals-based proxy
import { signal, computed, effect, batch, untracked } from './signal.js'

export const _signals = Symbol('signals'), _change = Symbol('length');

// FIXME: maybe separate array and object stores?
export default function store(values, parent) {
  const isArr = Array.isArray(values)

  // track last accessed property to find out if .length was directly accessed from expression or via .push/etc method
  let lastProp

  if (!values || (values?.constructor !== Object && !isArr)) return values;

  // ignore existing state as argument
  if (values[_signals] && !parent) return values;

  // NOTE: if you decide to unlazy values, think about large arrays - init upfront can be costly
  const
    // .length signal is stored outside, since it cannot be replaced
    // _len stores total values length (for objects as well)
    _len = signal(isArr ? values.length : Object.values(values).length),

    // dict with signals storing values
    signals = parent ? Object.create((parent = store(parent))[_signals]) : isArr ? [] : {},
    proto = signals.constructor.prototype;

  // proxy conducts prop access to signals
  const state = new Proxy(values, {
    // FIXME: instead of redefining this we can adjust :with directive
    has(values, key, child) { return values.hasOwnProperty(key) || parent?.hasOwnProperty(key) },

    get(values, key, child) {
      // console.log('get', key, lastProp)
      // if .length is read within .push/etc - peek signal (don't subscribe)
      if (isArr)
        if (key === 'length') return (proto[lastProp]) ? _len.peek() : _len.value;
        else lastProp = key;
      // standard methods
      if (proto[key]) return proto[key]
      if (key === _signals) return signals
      if (key === _change) return _len.value
      const s = signals[key] || touchSignal(key)
      return s?.value // existing property
    },

    set(values, key, v) {
      console.log('set', key, v)
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

      let s = signals[key] || touchSignal(key) || (signals[key] = signal()),
        cur = s.peek()

      // skip unchanged (although can be handled by last condition - we skip a few checks this way)
      if (v === cur);
      // stashed _set for values with getter/setter
      else if (s._set) s._set(v)
      // patch array
      else if (Array.isArray(v) && Array.isArray(cur)) {
        // if we update plain array (stored in signal) - take over value instead
        if (cur[_change]) untracked(() => {
          batch(() => {
            let i = 0, l = v.length, vals = values[key];
            for (; i < l; i++) cur[i] = vals[i] = v[i]
            cur.length = l // forces deleting tail signals
          })
        })
        else {
          s.value = v
        }
      }
      // .x = y
      else {
        // reflect change in values
        s.value = store(values[key] = v)
      }

      // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
      if (isArr) {
        if (key >= _len.peek()) {
          _len.value = signals.length = values.length = Number(key) + 1
        }
      }

      return true
    },

    deleteProperty(values, key) {
      // console.log('delete', key)
      const s = signals[key]
      if (s) {
        const del = s[Symbol.dispose]
        if (del) delete s[Symbol.dispose]
        delete signals[key]
        del?.()
      }
      delete values[key]
      if (!isArr && _len.value) _len.value--
      return true
    }
  })

  if (parent) {
    // touch parent keys
    for (let key in parent) parent[key]

    // we reset parent signals making sure they don't override own values
    for (let key in values) signals[key] = null
  }

  // take over existing store signals instead of creating new ones (touch to make sure they exist)
  if (values[_signals]) for (let key in values) signals[key] = values[_signals][key];

  // initialize signal for provided key
  function touchSignal(key) {
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

      return signals[key] = desc.value?.peek ? desc.value : signal(store(desc.value))
    }
  }

  return state
}
