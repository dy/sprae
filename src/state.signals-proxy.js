// signals-based proxy
// we need proxy for sandbox & arrays anyways
// also it seems faster than defining a bunch of props
// same time we need support signal inputs
// also signals provide nice tracking mechanism, unlike own arrays

import { signal, computed, effect } from '@preact/signals-core'
// import { signal, computed } from 'usignal/sync'
// import { signal, computed } from '@webreflection/signal'

export { effect as fx }

// default root sandbox
export const sandbox = {
  Array, Object, Number, String, Boolean, Date,
  console, window, document, history, navigator, location, screen, localStorage, sessionStorage,
  alert, prompt, confirm, fetch, performance,
  setTimeout, setInterval, requestAnimationFrame, requestIdleCallback
}


const isObject = v => v?.constructor === Object

const cache = new WeakMap

export default function createState(values, proto) {
  if (!values || typeof values !== 'object') return values;
  if (cache.has(values) && !proto) return values;

  const signals = proto ? Object.create(cache.get(createState(proto))) : Array.isArray(values) ? [] : {},
    state = new Proxy(signals, {
      get(signals, key) {
        // some technical props like .constructor are accessed via valueOf
        // same time in signals it's same as just .value (?not sure)
        return signals[key]?.valueOf()
      },
      set(signals, key, v) {
        const s = signals[key]
        if (!s) signals[key] = v.peek ? v : signal(createState(v))
        else if (s._set) s._set(v) // stashed _set for get/set props
        else if (isObject(v) && isObject(s.value)) Object.assign(s.value, v)
        else if (s.peek) s.value = createState(v)
        else signals[key] = v // non-signal values, like .length
        return true
      }
    })

  // for array - init signals for values
  if (Array.isArray(values)) for (let i = 0; i < values.length; i++) state[i] = values[i]
  // for object
  else if (isObject(values)) {
    const descs = Object.getOwnPropertyDescriptors(values)

    // define signal accessors for exported object
    for (let key in descs) {
      let desc = descs[key]

      // getter turns into computed
      if (desc.get) {
        const s = state[key] = computed(desc.get.bind(state))
        if (desc.set) s._set = desc.set.bind(state) // stash setter
      }
      else state[key] = desc.value
    }
  }

  cache.set(state, signals)

  return state
}
