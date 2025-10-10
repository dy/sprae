import { frag, call } from "../core.js"

export default el => (
  // <template :text="a"/> or previously initialized template
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  v => (v = call(v, el.textContent), el.textContent = v == null ? "" : v)
)
