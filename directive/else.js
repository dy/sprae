import { _on, _off, _state, frag } from '../core.js';

/**
 * Else directive - conditional branch following :if.
 * Can be used as `:else` or `:else :if="condition"`.
 * @param {Element | HTMLTemplateElement} el - Element with directive
 * @returns {() => void} Update function
 */
export default (el) => {
  let _el, _prev = el

  _el = el.content ? frag(el) : el
  _el[_state] ??= null  // mark _el (frag) as needing sprae

  // find holder
  while (_prev && !(_el._holder = _prev._holder)) _prev = _prev.previousSibling

  el.remove()
  el[_state] = null // mark as fake-spraed to stop further init, to lazy-sprae when branch matches

  _el._holder._clauses.push(_el._clause = [_el, true])

  return _el._holder.update
}
