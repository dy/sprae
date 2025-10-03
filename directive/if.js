// "centralized" version of :if
import sprae, { oncePerTick, _on, _off, _state, frag } from '../core.js';

// :if="a"
export default (el, state, _holder, _el, _match) => {
  // new element :if
  console.log(':if init', el)
  if (!el._holder) {
    // mark el as fake-spraed to delay init, since we sprae rest when branch matches, both :if and :else :if
    el[_state] ??= null

    _el = el.content ? frag(el) : el

    el.replaceWith(_holder = document.createTextNode(''))
    _el._holder = _holder._holder = _holder


    _holder._clauses = [_el._clause = [_el, false]]

    _holder.update = oncePerTick(() => {
      let match = _holder._clauses.find(([, s]) => s)
      console.group(':if update clauses', ..._holder._clauses)

      if (match != _match) {
        console.log(':if match', match)
        _match?.[0].remove()
        // FIXME: we don't turn off
        _match?.[0][_off]?.()
        if (_match = match) {
          _holder.before(_match[0].content || _match[0])
          // there's no :else after :if, so lazy-sprae here doesn't risk adding own destructor to own list of destructors
          !_match[0][_state] ? (delete _match[0][_state], sprae(_match[0], state)) : _match[0][_on]?.()
        }
      }
      console.groupEnd()
    })
  }
  // :else :if needs to be spraed all over to have clean list of offable effects
  else sprae(_el = el, state)

  // :else may have children to init which is called after :if
  // or preact can schedule :else after :if, so we ensure order of call by next tick
  return value => {
    console.log(':if update', _el, value)
    _el._clause[1] = value
    _el._holder.update()
  }
}
