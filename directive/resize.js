import { parse, decorate, _dispose } from "../core.js"

/**
 * Resize directive - ResizeObserver wrapper.
 * Function form receives {width, height, entry} object.
 *
 * :resize="({width, height}) => cols = Math.floor(width / 200)"
 * :resize.throttle-100="({width}) => narrow = width < 600"
 *
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Directive name with modifiers
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
const resize = (el, state, expr, name) => {
  const [, ...mods] = name.split('.')
  const evaluate = parse(expr).bind(el)

  const trigger = decorate(Object.assign((size) => {
    evaluate(state, fn => typeof fn === 'function' ? fn(size) : fn)
  }, { target: el }), mods)

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const rect = entry.contentRect
      trigger({ width: rect.width, height: rect.height, entry })
    }
  })

  ro.observe(el)

  return {
    [_dispose]() { ro.disconnect() }
  }
}

resize.observer = true
export default resize
