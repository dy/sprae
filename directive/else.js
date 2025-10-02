import sprae, { signal, _on, _off, _state, frag } from '../core.js';


// NOTE: we can reach :else counterpart whereas prev :else :if is on hold
export default (el, state, _holder, _el, _if, _prev) => (
  _prev = el._prev,

  el.replaceWith(_holder = el._holder = document.createTextNode('')),
  _el = el.content ? frag(el) : el,
  _el[_state] ??= null, // mark el as fake-spraed to delay init, since we sprae rest when branch matches
  _holder._el = _el,
  _holder._match = signal(1), // pre-create _match for :else :if, since the :if can be lazy-paused and :else after it relies on _prev (also it should be `true` to indicate that last :else is not active)
  (_holder.nextElementSibling || {})._prev = _holder, // propagate linked condition

  () => {
    if (_holder._match._if) return // bypass :else :if handler
    !_prev?._match.value ? (
      _holder.before(_el.content || _el),
      _el[_state] === null ? (delete _el[_state], sprae(_el, state)) : (_el[_on]?.())
    ) : (
      _el.remove(), _el[_off]?.()
    )
  }
)
