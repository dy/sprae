import { parse, decorate, _dispose } from "../core.js"

/**
 * Mount directive - lifecycle observer.
 * Runs once on connect. Function form receives element, can return cleanup.
 * Statement form runs directly.
 *
 * :mount="console.log('connected')"
 * :mount="el => (setup(el), () => cleanup(el))"
 * :mount="el => ref = el"
 *
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Directive name with modifiers
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
export default (el, state, expr, name) => {
  const [, ...mods] = name.split('.'),
    evaluate = parse(expr).bind(el)

  let cleanup

  const trigger = decorate(Object.assign(() => {
    const result = evaluate(state, fn => typeof fn === 'function' ? fn(el) : fn)
    if (typeof result === 'function') cleanup = result
  }, { target: el }), mods)

  trigger()

  return {
    [_dispose]() {
      cleanup?.()
      cleanup = null
    }
  }
}
