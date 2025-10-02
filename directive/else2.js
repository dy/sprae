import { _on, _off, _state, frag } from '../core.js';


// NOTE: we can reach :else counterpart whereas prev :else :if is on hold
export default (el, state, _el) => (

  _el = el.content ? frag(el) : el,

  _el._holder = el.previousSibling?._holder || el.previousSibling?.previousSibling?._holder,
  el.remove(),
  el[_state] = null, // mark as fake-spraed to stop further init, to lazy-sprae when branch matches

  _el._holder._clauses.push(_el._clause = [_el, true]),

  () => {
    _el._holder.update()
  }
)
