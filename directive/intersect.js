import { parse, decorate, _dispose } from "../core.js"

/**
 * Intersect directive - IntersectionObserver wrapper.
 * Statement form fires on enter. Function form receives entry for full control.
 *
 * :intersect="visible = true"
 * :intersect.once="loadImage()"
 * :intersect="entry => visible = entry.isIntersecting"
 *
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Directive name with modifiers
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
const intersect = (el, state, expr, name) => {
  const [, ...mods] = name.split('.')
  const evaluate = parse(expr).bind(el)

  let once = mods.includes('once')

  const trigger = decorate(Object.assign((entry) => {
    evaluate(state, fn => typeof fn === 'function' ? fn(entry) : fn)
  }, { target: el }), mods)

  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        trigger(entry)
        if (once) io.disconnect()
      }
    }
  })

  io.observe(el)

  return {
    [_dispose]() { io.disconnect() }
  }
}

intersect.observer = true
export default intersect
