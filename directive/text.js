import { frag } from "../core.js"

/**
 * Text directive - sets textContent reactively.
 * @param {Element | HTMLTemplateElement} el - Target element
 * @returns {(v: any) => void} Update function
 */
export default el => (
  // <template :text="a"/> or previously initialized template
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  v => (v = typeof v === 'function' ? v(el.textContent) : v, el.textContent = v == null ? "" : v)
)
