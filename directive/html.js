import sprae, { _dispose } from "../core.js"

/**
 * HTML directive - sets innerHTML and initializes nested directives.
 * Supports templates for fragment insertion.
 * @param {Element | HTMLTemplateElement} el - Target element
 * @param {Object} state - State object
 * @returns {(v: string | ((html: string) => string)) => void | (() => void)} Update function
 */
export default (el, state) => {
  // <template :html="a"/> - fragment case: use placeholder + range
  if (el.content) {
    let start = document.createTextNode(''),
        end = document.createTextNode(''),
        range = document.createRange()
    el.replaceWith(start, end)
    return v => {
      v = typeof v === 'function' ? v('') : v
      range.setStartAfter(start)
      range.setEndBefore(end)
      range.deleteContents()
      if (v != null && v !== '') {
        let frag = range.createContextualFragment(v)
        sprae(frag, state)
        range.insertNode(frag)
      }
    }
  }
  return v => (v = typeof v === 'function' ? v(el.innerHTML) : v, el.innerHTML = v == null ? "" : v, sprae(el, state), el[_dispose])
}
