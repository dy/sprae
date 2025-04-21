import { frag } from "../core.js";

export default el => (
  // <template :text="a"/> or previously initialized template
  // FIXME: replace with content maybe?
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  value => (el.textContent = value == null ? "" : value)
)
