import { parse, decorate, _dispose } from "../core.js"

/**
 * Change directive - normalized input write-back observer.
 * Handles type detection, coercion, caret preservation.
 *
 * :change="v => x = v"
 * :change.debounce-300="v => query = v"
 *
 * @param {Element} el - Form element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression (receives coerced value)
 * @param {string} name - Directive name with modifiers
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
export default (el, state, expr, name) => {
  const [, ...mods] = name.split('.'),
    evaluate = parse(expr).bind(el)

  // coerce value from element based on input type
  const coerce =
    el.type === 'checkbox' ? () => el.checked :
    el.type === 'select-multiple' ? () => [...el.selectedOptions].map(o => o.value) :
    /^(date|time|month|week)/.test(el.type) ? () => el.value :
    () => el.selectedIndex < 0 ? null : isNaN(el.valueAsNumber) ? el.value : el.valueAsNumber

  const handler = decorate(Object.assign(() => {
    evaluate(state, fn => typeof fn === 'function' ? fn(coerce()) : fn)
  }, { target: el }), mods)

  el.addEventListener('input', handler)
  el.addEventListener('change', handler)

  return {
    [_dispose]() {
      el.removeEventListener('input', handler)
      el.removeEventListener('change', handler)
    }
  }
}
