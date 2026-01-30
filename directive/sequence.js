import { _dispose, parse, decorate } from "../core.js"

/**
 * Sequence directive - chains event handlers.
 * Syntax: `:onclick..keyup.enter="handler"` - click triggers, then waits for Enter.
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} names - Chained event names separated by `..`
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
export default (el, state, expr, names) => {
  let cur, // current step callback
    off // current step disposal

  let steps = names.split('..').map((step, i, { length }) => step.split(':').reduce(
    (prev, str) => {
      const [name, ...mods] = str.slice(2).split('.')

      const evaluate = parse(expr).bind(el)

      const next = (fn, e) => cur = typeof fn === 'function' ? fn(e) : fn
      const trigger = decorate(Object.assign(
        e => (!i ? evaluate(state, (fn) => next(fn, e)) : next(cur, e), off(), off = steps[(i + 1) % length]()),
        { target: el }
      ), mods)


      return (_poff) => (
        _poff = prev?.(),
        trigger.target.addEventListener(name, trigger, trigger),
        () => (_poff?.(), trigger.target.removeEventListener(name, trigger))
      )
    }, null)
  )

  off = steps[0]()

  return {
    [Symbol.dispose]() {
      off?.()
    }
  }
}
