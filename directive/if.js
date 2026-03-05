import sprae, { throttle, _on, _off, _state, frag, mutate } from '../core.js';

/**
 * Conditional directive - shows/hides element based on condition.
 * Works with :else and :else :if for branching.
 * @param {Element | HTMLTemplateElement} el - Target element
 * @param {Object} state - State object
 * @returns {(value: any) => void} Update function
 */
export default (el, state) => {
  let _holder, _el

  // new element :if
  if (!el._holder) {
    // mark el as fake-spraed to delay init, since we sprae rest when branch matches, both :if and :else :if
    el[_state] ??= null

    _el = el.content ? frag(el) : el
    _el[_state] ??= null  // mark _el (frag) as needing sprae

    mutate(() => el.replaceWith(_holder = el.ownerDocument.createTextNode('')))
    _el._holder = _holder._holder = _holder


    _holder._clauses = [_el._clause = [_el, false]]
    _holder._match = null

    _holder.update = throttle(() => {
      let match = _holder._clauses.find(([, s]) => s)

      if (match != _holder._match) {
        mutate(() => {
          _holder._match?.[0].remove()
          _holder._match?.[0][_off]?.()
          if (_holder._match = match) {
            _holder.before(_holder._match[0].content || _holder._match[0])
            // check if element needs initial sprae (null) vs just re-enabling (_on)
            !_holder._match[0][_state] ? (delete _holder._match[0][_state], sprae(_holder._match[0], state)) : _holder._match[0][_on]?.()
          }
        })
      }
    })
  }
  // :else :if needs to be spraed all over to have clean list of offable effects
  else sprae(_el = el, state)

  // :else may have children to init which is called after :if
  // or preact can schedule :else after :if, so we ensure order of call by next tick
  let cb = value => {
    _el._clause[1] = value
    _el._holder.update()
  }
  cb[_off] = () => { _el._holder._match?.[0][_off]?.(); _el._holder._match = null }
  return cb
}
