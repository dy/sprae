// signals-based store implementation
import { signal, computed, effect, batch } from '@preact/signals-core'
// import { signal, computed } from 'usignal/sync'
// import { signal, computed } from '@webreflection/signal'

const isSignal = v => v?.peek
const isState = v => v?.[_st]
const isObject = v => v?.constructor === Object

const _st = Symbol('state')

export { effect, batch }

export default function createState(values, proto) {
  if (isState(values) && !proto) return values;

  // define signal accessors - creates signals for all object props

  if (isObject(values)) {
    const
      state = Object.create(proto || Object.getPrototypeOf(values)),
      signals = {},
      descs = Object.getOwnPropertyDescriptors(values)

    // define signal accessors for exported object
    for (let key in descs) {
      let desc = descs[key]

      // getter turns into computed
      if (desc.get) {
        let s = signals[key] = computed(desc.get.bind(state))
        Object.defineProperty(state, key, {
          get() { return s.value },
          set: desc.set?.bind(state),
          configurable: false,
          enumerable: true
        })
      }
      // regular value creates signal accessor
      else {
        let value = desc.value
        let s = signals[key] = isSignal(value) ? value :
          signal(
            // if initial value is an object - we turn it into sealed struct
            isObject(value) ? Object.seal(createState(value)) :
              Array.isArray(value) ? createState(value) :
                value
          )

        // define property accessor on struct
        Object.defineProperty(state, key, {
          get() { return s.value },
          set(v) {
            if (isObject(v)) {
              // new object can have another schema than the new one
              // so if it throws due to new props access then we fall back to creating new struct
              if (isObject(s.value)) try { Object.assign(s.value, v); return } catch (e) { }
              s.value = Object.seal(createState(v));
            }
            else if (Array.isArray(v)) s.value = createState(v)
            else s.value = v;

          },
          enumerable: true,
          configurable: false
        })
      }
    }

    Object.defineProperty(state, _st, { configurable: false, enumerable: false, value: true })

    return state
  }

  // for arrays we turn internals into signal structs
  // FIXME: make proxy to intercept length and other single values
  if (Array.isArray(values)) {
    for (let i = 0; i < values.length; i++) values[i] = createState(values[i])
  }

  return values
}
