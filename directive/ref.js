import { parse } from "../core.js"
// import { setter } from "./value.js"

export default (el, state, expr) => {
  let fn = parse(expr)(state)

  if (typeof fn == 'function') return {[Symbol.dispose]:fn(el)}

  // NOTE: we have to set element statically (outside of effect) to avoid parasitic sub - multiple els with same :ref can cause recursion (eg. :each :ref="x")
  // FIXME: do via (setter(expr)(state, el))
  else Object.defineProperty(state, expr, { value: el, configurable: true })
}
