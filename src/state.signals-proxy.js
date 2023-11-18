// signals-based proxy
// + we need proxy for sandbox & arrays anyways
// + it seems faster than defining a bunch of props on sealed state object
// + we need support signal inputs
// + signals provide nice tracking mechanism, unlike own arrays
// + signals detect cycles
// + it's just robust
// ? must it modify initial store

import { signal, computed, effect, batch, untracked } from '@preact/signals-core'
// import { signal, computed } from 'usignal/sync'
// import { signal, computed } from '@webreflection/signal'

export { effect, computed, batch, untracked }

export const _dispose = (Symbol.dispose ||= Symbol('dispose'));
export const _signals = Symbol('signals');


// default root sandbox
export const sandbox = {
  Array, Object, Number, String, Boolean, Date,
  console, window, document, history, navigator, location, screen, localStorage, sessionStorage,
  alert, prompt, confirm, fetch, performance,
  setTimeout, setInterval, requestAnimationFrame
}

const isObject = v => v?.constructor === Object
const isPrimitive = (value) => value !== Object(value);

// track last accessed property to figure out if .length was directly accessed from expression or via .push/etc method
let lastProp

export default function createState(values, parent) {
  if (!isObject(values) && !Array.isArray(values)) return values;
  // ignore existing state as argument
  if (values[_signals] && !parent) return values;
  const initSignals = values[_signals]

  // .length signal is stored outside, since cannot be replaced
  const _len = Array.isArray(values) && signal((initSignals || values).length),
    // dict with signals storing values
    signals = parent ? Object.create((parent = createState(parent))[_signals]) : Array.isArray(values) ? [] : {},
    proto = signals.constructor.prototype;

  // proxy conducts prop access to signals
  const state = new Proxy(values, {
    // sandbox everything
    has() { return true },
    get(values, key) {
      // if .length is read within .push/etc - peek signal (don't subscribe)
      if (_len)
        if (key === 'length') return (proto[lastProp]) ? _len.peek() : _len.value;
        else lastProp = key;
      if (proto[key]) return proto[key]
      if (key === _signals) return signals
      const s = signals[key] || initSignal(key)
      if (s) return s.value // existing property
      if (parent) return parent[key]; // touch parent
      return sandbox[key] // Array, window etc
    },
    set(values, key, v) {
      if (_len) {
        // .length
        if (key === 'length') {
          batch(() => {
            // force cleaning up tail
            for (let i = v, l = signals.length; i < l; i++) delete state[i]
            _len.value = signals.length = values.length = v;
          })
          return true
        }
      }

      const s = signals[key] || initSignal(key, v) || signal()
      const cur = s.peek()

      // skip unchanged (although can be handled by last condition - we skip a few checks this way)
      if (v === cur);
      // stashed _set for values with getter/setter
      else if (s._set) s._set(v)
      // patch array
      else if (Array.isArray(v) && Array.isArray(cur)) {
        untracked(() => batch(() => {
          let i = 0, l = v.length, vals = values[key];
          for (; i < l; i++) cur[i] = vals[i] = v[i]
          cur.length = l // forces deleting tail signals
        }))
      }
      // .x = y
      else {
        // reflect change in values
        s.value = createState(values[key] = v)
      }

      // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
      if (_len && key >= _len.peek()) _len.value = signals.length = values.length = Number(key) + 1

      return true
    },
    deleteProperty(values, key) {
      signals[key]?._del?.(), delete signals[key], delete values[key]
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
