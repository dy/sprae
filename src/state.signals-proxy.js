// signals-based proxy
// + we need proxy for sandbox & arrays anyways
// + it seems faster than defining a bunch of props on sealed state object
// + we need support signal inputs
// + signals provide nice tracking mechanism, unlike own arrays
// + signals detect cycles
// + it's just robust

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
const toSignal = v => v?.peek ? v : signal(createState(v))

const memo = new WeakMap

export default function createState(values, proto) {
  if (!isObject(values) && !Array.isArray(values)) return values;
  if (memo.has(values) && !proto) return values;

  const _length = Array.isArray(values) ? signal(0) : null,
    signals = proto ? Object.create(memo.get(createState(proto))) : Array.isArray(values) ? [] : {},
    state = new Proxy(signals, {
      // sandbox everything
      has() { return true },
      get(signals, key) {
        const s = signals[key]
        // .constructor, .slice etc
        if (typeof s === 'function') return s
        // console.log('get', key, signals)
        // length needs outside stash since array can't redefine it
        if (_length && key === 'length') return _length.value
        return s ? s.value : sandbox[key]
      },
      set(signals, key, v) {
        const s = signals[key]
        // console.log('set', key, v)
        if (!s) signals[key] = toSignal(v)
        else if (s._set) s._set(v) // stashed _set for get/set props
        // FIXME: is there meaningful way to update same-signature object?
        // else if (isObject(v) && isObject(s.value)) Object.assign(s.value, v)
        else if (s.peek) s.value = createState(v)
        else signals[key] = v // non-signal values, like .length

        if (_length && key === 'length') _length.value = v // update array length dependents
        return true
      }
    })

  // for array - init signals for values
  if (Array.isArray(values)) state.push(...values)
  // for object - init from descriptors
  else {
    const descs = Object.getOwnPropertyDescriptors(values)

    // define signal accessors for exported object
    for (let key in descs) {
      let desc = descs[key]

      // getter turns into computed
      if (desc.get) {
        const s = signals[key] = computed(desc.get.bind(state))
        if (desc.set) s._set = desc.set.bind(state) // stash setter
      }
      else {
        // NOTE: we recreate signal props instead of just setting them to make sure proto is unaffected
        signals[key] = toSignal(desc.value)
      }
    }
  }

  memo.set(state, signals)

  return state
}
