import { queueMicrotask } from "./util.js"

// currentFx stack of listeners
let currentFx, batch = new Set, pendingUpdate

const targetFxs = new WeakMap
const targetProxy = new WeakMap
const proxyTarget = new WeakMap
const _parent = Symbol('parent')

// default root sandbox
export const sandbox = {
  Array, Object, Number, String, Boolean, Date,
  console
}

const handler = {
  has(){
    // sandbox everything
    return true
  },

  get(target, prop) {
    if (typeof prop === 'symbol') return target[prop]
    if (!(prop in target)) return target[_parent]?.[prop]
    if (Array.isArray(target) && prop in Array.prototype) return target[prop];
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
    if (!(prop in target) && (target[_parent] && prop in target[_parent])) return target[_parent][prop] = value
    if (Array.isArray(target) && prop in Array.prototype) return target[prop] = value;

    const prev = target[prop]

    // avoid bumping unchanged values
    if (Object.is(prev, value)) return true

    target[prop] = value

    // whenever target prop is set, call all dependent fxs
    let propFxs = targetFxs.get(target)?.[prop]

    if (propFxs) for (let fx of propFxs) batch.add(fx)
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

export const state = (obj, parent) => {
  if (targetProxy.has(obj)) return targetProxy.get(obj)
  if (proxyTarget.has(obj)) return obj // is proxy already

  let proxy = new Proxy(obj, handler)
  targetProxy.set(obj, proxy)
  proxyTarget.set(proxy, obj)

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
  if (!pendingUpdate) {
    pendingUpdate = true
    queueMicrotask(() => {
      for (let fx of batch) fx.call()
      batch.clear()
      pendingUpdate = false
    })
  }
}
