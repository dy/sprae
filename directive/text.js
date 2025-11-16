import { frag } from "../core.js"

export default el => (
  // <template :text="a"/> or previously initialized template
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  v => (v = typeof v === 'function' ? v(el.textContent) : v, el.textContent = v == null ? "" : v)
)
