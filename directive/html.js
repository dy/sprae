import sprae, { untracked, frag, _dispose, _state } from "../core.js"

/**
 * HTML directive - sets innerHTML and initializes nested directives.
 * Supports templates for fragment insertion.
 * @param {Element | HTMLTemplateElement} el - Target element
 * @param {Object} state - State object
 * @returns {(v: string | ((html: string) => string)) => void | (() => void)} Update function
 */
export default (el, state) => {
  // <template :html="a"/> - fragment case: use placeholder + frag
  if (el.content) {
    let _el, html = '',
      doc = el.ownerDocument,
      holder = el._holder

    if (!holder) el.replaceWith(holder = doc.createTextNode(''))

    return v => {
      if (typeof v === 'function') v = v(html)

      // :if case: remove current content from DOM
      if (el._holder) el.remove(), el.content.replaceChildren()
      _el?.remove()

      if (v != null && v !== '') {
        _el = frag((_el = doc.createElement('template'), _el.innerHTML = html = v, _el))

        untracked(() => sprae(_el, state))

        holder.before(_el.content)

        // :if case: update childNodes in-place for remove() closure
        if (el._holder) el.childNodes.splice(0, Infinity, ..._el.childNodes)

        return _el[_dispose]
      }
      else if (el._holder) el.childNodes.length = 0, html = ''
    }
  }

  return v => (
    v = typeof v === 'function' ? v(el.innerHTML) : v,
    el.innerHTML = v == null ? "" : v,
    el[_state] &&= null,
    untracked(() => sprae(el, state)),
    el[_dispose]
  )
}
