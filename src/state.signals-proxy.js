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

export default function createState(values, parent) {
  if (!isObject(values) && !Array.isArray(values)) return values;
  if (memo.has(values) && !parent) return values;

  const isArray = Array.isArray(values),
    signals = parent ? Object.create(memo.get(parent = createState(parent))) : Array.isArray(values) ? [] : {},
    state = new Proxy(signals, {
      // sandbox everything
      has() { return true },
      get(signals, key) {
        return getSignal(key)?.valueOf()
      },
      set(signals, key, v) {
        const s = getSignal(key)
        // console.log('set', key, v)

        // create new unknown property
        if (!s) signals[key] = signal(createState(v?.valueOf()))

        // stashed _set for values with getter/setter
        else if (s._set) s._set(v)
        // FIXME: is there meaningful way to update same-signature object?
        // else if (isObject(v) && isObject(s.value)) Object.assign(s.value, v)
        else s.value = createState(v?.valueOf())

        return true
      }
    })

  // gets / initializes signal for provided key
  function getSignal(key) {
    const _key = isArray && key === 'length' ? '__length' : key
    let s = signals[_key]

    // init value
    if (!s) {
      if (values.hasOwnProperty(key)) {
        // create signal from descriptor
        const desc = Object.getOwnPropertyDescriptor(values, key)
        // getter turns into computed
        if (desc?.get) {
          (s = signals[_key] = computed(desc.get.bind(state)))._set = desc.set?.bind(state) // stash setter
        }
        else {
          // NOTE: we recreate signal props instead of just setting them to make sure parent is unaffected
          s = signals[_key] = desc.value?.peek ? desc.value : signal(createState(desc.value))
        }
      }
      // touch parent (lazy-inits there)
      else if (parent) parent[key], s = signals[_key]

      // Array, window etc
      if (!s && sandbox.hasOwnProperty(key)) return sandbox[key]
    }

    return s
  }

  memo.set(state, signals)

  return state
}
