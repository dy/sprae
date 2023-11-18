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
  if (values.$ && !parent) return values;
  const initSignals = values.$
  // console.group('createState', values, parent)
  // .length signal is stored outside, since cannot be replaced
  const _len = Array.isArray(values) && signal((initSignals || values).length),
    // dict with signals storing values
    signals = parent ? Object.create((parent = createState(parent)).$) : Array.isArray(values) ? [] : {},
    proto = signals.constructor.prototype;

  // proxy conducts prop access to signals
  const state = new Proxy(values, {
    // sandbox everything
    has() { return true },
    get(values, key) {
      // console.log('get', key)
      // if .length is read within .push/etc - peek signal (don't subscribe)
      if (_len)
        if (key === 'length') return (proto[lastProp]) ? _len.peek() : _len.value;
        else lastProp = key;
      if (proto[key]) return proto[key]
      if (key === '$') return signals
      const s = signals[key] || initSignal(key)
      return s?.valueOf()
    },
    set(values, key, v) {
      if (_len) {
        // .length
        if (key === 'length') {
          // force cleaning up tail
          for (let i = v, l = signals.length; i < l; i++) delete state[i]
          // force init new signals
          for (let i = signals.length; i < v; i++) state[i] = null
          _len.value = signals.length = values.length = v;
          return true
        }
      }
      if (key === '$') return false

      // console.log('set', key, v)
      const s = signals[key] || initSignal(key)
      // new unknown property
      // FIXME: why do we need this? It must be created by initSignal, no?
      if (!s) signals[key] = signal(isPrimitive(v) ? v : createState(v))
      // skip unchanged (although can be handled by last condition - we skip a few checks this way)
      else {
        const cur = s.peek()
        if (v === cur);
        // stashed _set for values with getter/setter
        else if (s._set) s._set(v)
        // patch array
        else if (Array.isArray(v) && Array.isArray(cur)) {
          untracked(() => {
            let i = 0, l = v.length;
            for (; i < l; i++) cur[i] = values[key][i] = v[i]
            cur.length = l // forces deleting tail signals
            batch(() => (s.value = null, s.value = cur)) // bump effects
          })
        }
        // patch object
        // NOTE: we don't patch object
        // else if (isObject(v) && isObject(cur)) {
        //   untracked(() => {
        //     // FIXME: it's possible to run batch here instead of rerendering every other item
        //     for (let p in cur) if (!v.hasOwnProperty(p)) delete cur[p] // delete removed signals
        //     for (let p in v) cur[p] = values[key][p] = v[p] // patch existing items
        //     batch(() => (s.value = null, s.value = cur)) // make sure state is bumped (clone)
        //   })
        // }
        // .x = y
        else {
          // reflect change in values
          // FIXME: likely we need to change parent here
          if (Array.isArray(cur)) cur.length = 0 // cleanup array subs
          s.value = createState(values[key] = v)
        }
      }

      // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
      if (_len && key >= _len.peek()) _len.value = signals.length = values.length = Number(key) + 1
      return true
    },
    deleteProperty(values, key) {
      if (key in signals) signals[key]._delete?.(), delete signals[key], delete values[key]
      return true
    }
  })

  // init signals placeholders (instead of ownKeys & getOwnPropertyDescriptor handlers)
  // if values are existing proxy (in case of extending parent) - take its signals instead of creating new ones
  for (let key in values) values[key], signals[key] = initSignals?.[key] ?? null;

  // initialize signal for provided key
  // FIXME: chances are there's redundant checks
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

    // touch parent
    // FIXME: something fishy's going on here - we don't return signal
    if (parent) return parent[key]

    // Array, window etc
    if (sandbox.hasOwnProperty(key)) return sandbox[key]
  }

  // console.groupEnd()
  return state
}
