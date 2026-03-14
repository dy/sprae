import { parse, decorate, _dispose } from "../core.js"

/**
 * Resize directive - ResizeObserver wrapper.
 * Fires when element dimensions change.
 *
 * :resize="cols = Math.floor(width / 200)"
 * :resize="({width, height}) => recalc(width, height)"
 * :resize.throttle-100="recalc()"
 *
 * Statement form: `width` and `height` are injected into scope.
 * Function form: receives {width, height, entry} object.
 *
 * Modifiers:
 *   .border — observe border-box (default: content-box)
 *   .throttle-N, .debounce-N, .raf — timing
 *
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Directive name with modifiers
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
const resize = (el, state, expr, name) => {
  const [, ...rawMods] = name.split('.')
  const evaluate = parse(expr).bind(el)

  let box = 'content-box'
  const mods = rawMods.filter(m => {
    if (m === 'border') return (box = 'border-box', false)
    return true
  })

  const trigger = decorate(Object.assign((size) => {
    evaluate(state, fn => typeof fn === 'function' ? fn(size) : fn)
  }, { target: el }), mods)

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const rect = entry.contentRect
      trigger({ width: rect.width, height: rect.height, entry })
    }
  })

  ro.observe(el, { box })

  return {
    [_dispose]() { ro.disconnect() }
  }
}

resize.observer = true
export default resize
