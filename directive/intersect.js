import { parse, decorate, _dispose } from "../core.js"

/**
 * Intersect directive - IntersectionObserver wrapper.
 * Fires when element enters/exits viewport.
 *
 * :intersect="visible = true"
 * :intersect.once="loadContent()"
 * :intersect.half="visible = true"
 * :intersect.full="visible = true"
 * :intersect.threshold-50="ratio = entry.intersectionRatio"
 * :intersect="entry => ratio = entry.intersectionRatio"
 *
 * Modifiers:
 *   .once — disconnect after first trigger
 *   .half — threshold 0.5
 *   .full — threshold 0.99
 *   .threshold-N — custom threshold (0-100, mapped to 0-1)
 *   .margin-Npx — rootMargin (e.g., .margin-200px)
 *   .leave — fire on exit instead of entry
 *
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Directive name with modifiers
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
const intersect = (el, state, expr, name) => {
  const [, ...rawMods] = name.split('.')
  const evaluate = parse(expr).bind(el)

  // extract observer-specific modifiers before passing to decorate
  let threshold = 0, rootMargin = '0px', leave = false, once = false
  const mods = rawMods.filter(m => {
    if (m === 'half') return (threshold = 0.5, false)
    if (m === 'full') return (threshold = 0.99, false)
    if (m === 'leave') return (leave = true, false)
    if (m.startsWith('threshold')) return (threshold = (+m.split('-')[1] || 0) / 100, false)
    if (m.startsWith('margin')) return (rootMargin = m.split('-').slice(1).join('-'), false)
    if (m === 'once') return (once = true, true) // pass through to decorate too
    return true
  })

  const trigger = decorate(Object.assign((entry) => {
    evaluate(state, fn => typeof fn === 'function' ? fn(entry) : fn)
  }, { target: el }), mods)

  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (leave ? !entry.isIntersecting : entry.isIntersecting) {
        trigger(entry)
        if (once) io.disconnect()
      }
    }
  }, { threshold, rootMargin })

  io.observe(el)

  return {
    [_dispose]() { io.disconnect() }
  }
}

intersect.observer = true
export default intersect
