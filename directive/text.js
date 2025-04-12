import { frag } from "../core.js";

export default el => (
  // <template :text="a"/> or previously initialized template
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  value => el.textContent = value == null ? "" : value
)
