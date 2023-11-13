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
export const memo = new WeakMap

const isPrimitive = (value) => value !== Object(value);

// track last accessed property to figure out if .length was directly accessed from expression or via .push/etc method
let lastProp

export default function createState(values, parent) {
  if (!isObject(values) && !Array.isArray(values)) return values;
  // ignore existing state as argument
  if (memo.has(values) && !parent) return values;
  // console.group('createState', values, parent)
  // .length signal is stored outside, since cannot be replaced
  const _len = Array.isArray(values) && signal(values.length),
    // dict with signals storing values
    signals = parent ? Object.create(memo.get(parent = createState(parent))) : Array.isArray(values) ? [] : {},
    proto = signals.constructor.prototype,
    // proxy conducts prop access to signals
    state = new Proxy(signals, {
      // sandbox everything
      has() { return true },
      get(signals, key) {
        // console.log('get', key)
        // if .length is read within .push/etc - peek signal (don't subscribe)
        if (_len)
          if (key === 'length') return (proto[lastProp]) ? _len.peek() : _len.value;
          else lastProp = key;
        if (proto[key]) return proto[key]
        const s = signals[key] || initSignal(key)
        return s?.valueOf()
      },
      set(signals, key, v) {
        // console.log('set', key, v)
        if (_len) {
          // .length
          if (key === 'length') {
            // force cleaning up tail
            // for (let i = v, l = signals.length; i < l; i++) delete state[i]
            _len.value = signals.length = v;
            return true
          }
        }

        const s = signals[key] || initSignal(key)
        v = v?.valueOf();
        console.log('set', key, v)
        // new unknown property
        // FIXME: why do we need this? It must be created by initSignal, no?
        if (!s) signals[key] = signal(isPrimitive(v) ? v : createState(v))
        // skip unchanged (although handled in last case - we skip a few iterations)
        else if (v === s.peek());
        // stashed _set for values with getter/setter
        else if (s._set) s._set(v)
        else if (isPrimitive(v)) s.value = v
        // FIXME: patch array
        // FIXME: patch object
        else if (isObject(v) && isObject(s.peek())) {
          Object.assign(s.value, v)
          for (let key in s.peek()) if (!v.hasOwnProperty(key)) s.value[key] = undefined
        }
        // .x = y
        else s.value = createState(v)

        // force changing length, if eg. a=[]; a[1]=1 - need to come after setting the item
        if (_len && key >= _len.peek()) _len.value = signals.length = Number(key) + 1

        return true
      },
      deleteProperty(signals, key) {
        // console.log('delete', key)
        if (key in signals) delete signals[key]
        return true
      }
    })

  // init signals placeholders (instead of ownKeys & getOwnPropertyDescriptor handlers)
  // if values are existing proxy - take its signals instead of creating new ones
  let initSignals = memo.get(values)
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
      return signals[key] = desc.value?.peek ? desc.value : signal(createState(desc.value))
    }

    // touch parent
    // FIXME: something fishy's going on here - we don't return signal
    if (parent) return parent[key]

    // Array, window etc
    if (sandbox.hasOwnProperty(key)) return sandbox[key]
  }

  memo.set(state, signals)
  // console.groupEnd()
  return state
}
