// proxy-based store implementation: more flexible, less optimal and with memory leak now
// FIXME: make simpler prototype chain, likely manual
// FIXME: detect circular updates
import { queueMicrotask } from "./util.js"

// currentFx stack of listeners
let currentFx, batch = [], pendingUpdate

const targetFxs = new WeakMap
const targetProxy = new WeakMap
const proxyTarget = new WeakMap
const _parent = Symbol('parent')

// default root sandbox
export const sandbox = {
  Array, Object, Number, String, Boolean, Date,
  console, window, document, history, location
}

const callArg = (fn) => fn(), nop = () => { }
export { callArg as batch };

let lastProp

const handler = {
  has() {
    // sandbox everything
    return true
  },

  get(target, prop) {
    if (typeof prop === 'symbol') return lastProp = null, target[prop]
    if (!(prop in target)) return target[_parent]?.[prop]

    // ignore .length effects called within .push
    if (lastProp && prop === 'length') return lastProp = null, target[prop];

    // .constructor, .slice etc
    if (Object.prototype[prop]) return target[prop]
    if (Array.isArray(target) && Array.prototype[prop] && prop !== 'length') return lastProp = prop, target[prop];

    let value = target[prop]

    if (currentFx) {
      // get actual target from prototype chain
      // while (!target.hasOwnProperty(prop)) target = Object.getPrototypeOf(target)

      // register an fx for target-prop path
      let propFxs = targetFxs.get(target)
      if (!propFxs) targetFxs.set(target, propFxs = {})
      if (!propFxs[prop]) propFxs[prop] = [currentFx]
      else if (!propFxs[prop].includes(currentFx)) propFxs[prop].push(currentFx)
    }

    // if internal is trackable path - return proxy
    if ((value && value.constructor === Object) || Array.isArray(value)) {
      let proxy = targetProxy.get(value)
      // FIXME: we can avoid saving it here, since it's created by new state
      if (!proxy) targetProxy.set(value, proxy = new Proxy(value, handler))
      return proxy
    }

    return value
  },

  set(target, prop, value) {
    // "fake" prototype chain, since regular one doesn't fit
    if (!(prop in target) && (target[_parent] && prop in target[_parent])) return target[_parent][prop] = value

    // avoid bumping unchanged values
    if (!Array.isArray(target) && Object.is(target[prop], value)) return true

    target[prop] = value

    // whenever target prop is set, call all dependent fxs
    let propFxs = targetFxs.get(target)?.[prop]

    if (propFxs) for (let fx of propFxs) {
      // put fx latest
      if (fx.planned != null) batch[fx.planned] = null
      fx.planned = batch.push(fx) - 1
    }
    planUpdate()

    // FIXME: unsubscribe / delete effects by setting null/undefined
    // if (value == null) targetFxs.delete(prev)

    return true
  },

  deleteProperty(target, prop) {
    target[prop] = undefined
    delete target[prop]
    return true
  }
}

export default function state(obj, parent) {
  if (targetProxy.has(obj)) return targetProxy.get(obj)
  if (proxyTarget.has(obj)) return obj // is proxy already

  let proxy = new Proxy(obj, handler)
  targetProxy.set(obj, proxy)
  proxyTarget.set(proxy, obj)

  // bind all getters & functions here to proxy
  // FIXME: alternatively we can store getters somewhere
  let descriptors = Object.getOwnPropertyDescriptors(obj)
  for (let name in descriptors) {
    let desc = descriptors[name]
    if (desc.get) {
      if (desc.get) desc.get = desc.get.bind(proxy), Object.defineProperty(obj, name, desc)
    }
    // else if (typeof desc.value === 'function') {
    //   desc.value = desc.value.bind(proxy), Object.defineProperty(obj, name, desc)
    // }
  }

  // inherit from parent state
  obj[_parent] = parent ? state(parent) : sandbox

  return proxy
}

export const fx = (fn) => {
  const call = () => {
    let prev = currentFx
    currentFx = call
    fn()
    currentFx = prev
  }

  // collect deps from the first call
  call()

  return call
}

export const planUpdate = () => {
  // if (!pendingUpdate) {
  //   pendingUpdate = true
  //   queueMicrotask(() => {
  let fx
  while (batch.length) fx = batch.shift(), fx && (fx(), fx.planned = null)
  //     pendingUpdate = false
  //   })
  // }
}
