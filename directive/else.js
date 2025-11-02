import { _on, _off, _state, frag } from '../core.js';


// NOTE: we can reach :else counterpart whereas prev :else :if is on hold
export default (el) => {
  let _el, _prev = el

  // console.log(':else init', el)
  _el = el.content ? frag(el) : el

  // find holder
  while (_prev && !(_el._holder = _prev._holder)) _prev = _prev.previousSibling

  el.remove()
  el[_state] = null // mark as fake-spraed to stop further init, to lazy-sprae when branch matches

  _el._holder._clauses.push(_el._clause = [_el, true])

  return _el._holder.update
}
