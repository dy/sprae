import sprae, { _dispose } from "../core.js"

/**
 * HTML directive - sets innerHTML and initializes nested directives.
 * Supports templates for fragment insertion.
 * @param {Element | HTMLTemplateElement} el - Target element
 * @param {Object} state - State object
 * @returns {(v: string | ((html: string) => string)) => void | (() => void)} Update function
 */
export default (el, state) => {
  // <template :html="a"/> - fragment case: use placeholder
  if (el.content) {
    let _start = el.ownerDocument.createTextNode(''),
        _end = el.ownerDocument.createTextNode(''),
        _holder = el.ownerDocument.createElement('_')
    _holder.append((el.replaceWith(_start, _end), el.content))
    return v => {
      v = typeof v === 'function' ? v(_holder.innerHTML) : v
      _holder.innerHTML = v == null ? "" : v
      sprae(_holder, state)
      while(_start.nextSibling !== _end) _start.nextSibling.remove()
      return (_end.before(..._holder.cloneNode(true).childNodes), _holder[_dispose])
    }
  }
  return v => (v = typeof v === 'function' ? v(el.innerHTML) : v, el.innerHTML = v == null ? "" : v, sprae(el, state), el[_dispose])
}
