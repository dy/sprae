import { parse, decorate } from "../core.js"

/**
 * Event directive - attaches event listeners with modifiers.
 * Syntax: `:onclick="handler"` or `:onclick.prevent.stop="handler"`
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Event name with modifiers (e.g., 'onclick.prevent')
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
export default (el, state, expr, name) => {
  // wrap inline cb into function
  // if (!/^(?:[\w$]+|\([^()]*\))\s*=>/.test(expr) && !/^function\b/.test(expr)) expr = `()=>{${expr}}`;

  const [type, ...mods] = name.slice(2).split('.'),
    evaluate = parse(expr).bind(el),
    trigger = decorate(Object.assign(e => evaluate(state, (fn) => typeof fn === 'function' ? fn(e) : fn), { target: el }), mods);

  trigger.target.addEventListener(type, trigger, trigger)
  return {
    [Symbol.dispose]() {
      trigger.target.removeEventListener(type, trigger)
    }
  }
}
