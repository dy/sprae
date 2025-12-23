import sprae, { _dispose, frag } from "../core.js"

export default (el, state) => (
  // <template :html="a"/> or previously initialized template
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  v => (v = typeof v === 'function' ? v(el.innerHTML) : v, el.innerHTML = v == null ? "" : v, sprae(el, state), el[_dispose])
)
