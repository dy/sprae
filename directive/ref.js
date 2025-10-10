import { setter, parse } from "../core.js"

export default (el, state, expr, name, _prev, _set) => (
  typeof parse(expr)(state) == 'function' ?
    v => (v(el)) :
    // NOTE: we have to set element statically (outside of effect) to avoid parasitic sub - multiple els with same :ref can cause recursion (eg. :each :ref="x")
    (setter(expr)(state, el))
)
