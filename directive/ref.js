import { parse } from "../core.js"
import { setter } from "./value.js"

/**
 * Ref directive - stores element reference in state.
 * If expression is a function, calls it with element (returns dispose).
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Variable name or function expression
 * @returns {{ [Symbol.dispose]: () => void } | void} Disposal object or void
 */
export default (el, state, expr) => {
  let fn = parse(expr)(state)

  if (typeof fn == 'function') return {[Symbol.dispose]:fn(el)}

  // NOTE: we have to set element statically (outside of effect) to avoid parasitic sub - multiple els with same :ref can cause recursion (eg. :each :ref="x")
  // Object.defineProperty(state, expr, { value: el, configurable: true })
  setter(expr)(state, el)
}
