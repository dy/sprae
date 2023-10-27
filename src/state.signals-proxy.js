// signals-based proxy
// + we need proxy for sandbox & arrays anyways
// + it seems faster than defining a bunch of props on sealed state object
// + we need support signal inputs
// + signals provide nice tracking mechanism, unlike own arrays
// + signals detect cycles
// + it's just robust
// ? must it modify initial store

import { signal, computed, effect, batch } from '@preact/signals-core'
// import { signal, computed } from 'usignal/sync'
// import { signal, computed } from '@webreflection/signal'

export { effect as fx, batch }

// default root sandbox
export const sandbox = {
  Array, Object, Number, String, Boolean, Date,
  console, window, document, history, navigator, location, screen, localStorage, sessionStorage,
  alert, prompt, confirm, fetch, performance,
  setTimeout, setInterval, requestAnimationFrame, requestIdleCallback
}

const isObject = v => v?.constructor === Object
const memo = new WeakMap

// track last accessed property to figure out if .length was directly accessed from expression or via .push/etc method
let lastProp

export default function createState(values, parent) {
  if (!isObject(values) && !Array.isArray(values)) return values;
  if (memo.has(values) && !parent) return values;
  // .length signal is stored outside, since cannot be replaced
  const _len = Array.isArray(values) && signal(values.length),
    // dict with signals storing values
    signals = parent ? Object.create(memo.get(parent = createState(parent))) : Array.isArray(values) ? [] : {},
    // proxy conducts prop access to signals
    state = new Proxy(signals, {
      // sandbox everything
      has() { return true },
      get(signals, key) {
        // console.log('get', key)
        let v
        // if .length is read within .push/etc - peek signal (don't subscribe)
        if (_len && key === 'length') v = Array.prototype[lastProp] ? _len.peek() : _len.value;
        else v = (signals[key] || initSignal(key))?.valueOf()
        if (_len) lastProp = key
        return v
      },
      set(signals, key, v) {
        // .length
        if (_len && key === 'length') _len.value = signals.length = v;

        else {
          const s = signals[key] || initSignal(key)

          // new unknown property
          if (!s) signals[key] = signal(createState(v?.valueOf()))
          // stashed _set for values with getter/setter
          else if (s._set) s._set(v)
          // FIXME: is there meaningful way to update same-signature object?
          // else if (isObject(v) && isObject(s.value)) Object.assign(s.value, v)
          // .x = y
          else s.value = createState(v?.valueOf())
        }

        if (_len) lastProp = null
        return true
      }
    })

  // init signals placeholders (instead of ownKeys & getOwnPropertyDescriptor handlers)
  for (let key in values) {
    signals[key] = null // make placeholder
  }

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

      // NOTE: we explicitly read values[key] instead of desc.value since it can be lazy-uninitialized
      return signals[key] = desc.value?.peek ? values[key] : signal(createState(values[key]))
    }

    // touch parent
    if (parent) return parent[key]

    // Array, window etc
    if (sandbox.hasOwnProperty(key)) return sandbox[key]
  }

  memo.set(state, signals)

  return state
}
