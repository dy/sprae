import { parse } from "../core.js"

/**
 * Creates a setter function for assigning a value to a state path.
 * @param {string} expr - Expression to assign to (e.g., "x" or "refs.el")
 * @returns {(target: Object, value: any) => void} Setter function
 */
const setter = (expr, _set = parse(`${expr}=__`)) => (target, value) => {
  target.__ = value; _set(target), delete target.__
}

/**
 * Ref directive - stores element reference in state or calls callback with element.
 *
 * :ref="x"                    → state.x = el
 * :ref="refs.el"              → state.refs.el = el
 * :ref="el => setup(el)"      → calls callback with element
 *
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Variable name, path, or callback expression
 */
export default (el, state, expr) => {
  let result = parse(expr).call(el, state)
  if (typeof result === 'function') result(el)
  else setter(expr)(state, el)
}
