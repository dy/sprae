import sprae, { signal, _on, _off, _state, frag } from '../core.js';

// :if="a"
export default (el, state, _holder, _el, _prev) => (
  // new element :if
  !el._holder ?
    (
      el.replaceWith(_holder = document.createTextNode('')),
      _el = el.content ? frag(el) : el,
      el._holder = _holder,
      _el[_state] ??= null, // mark el as fake-spraed to delay init, since we sprae rest when branch matches
      console.log('init if'),
      _holder._el = el,
      _holder._match = signal(1), // indicates if current clause or any prev clause matches
      (_holder.nextElementSibling || {})._prev = _holder, // propagate linked condition

      value => (
        console.group('if', el),

        (_holder._match.value = value) ? (
          console.log('if yes', _el),
          _holder.before(_el.content || _el),
          // there's no :else after :if, so lazy-sprae here doesn't risk adding own destructor to own list of destructors
          _el[_state] === null ? (delete _el[_state], sprae(_el, state)) : _el[_on]?.()
        ) : (
          console.log('if no', _el),
          _el.remove(), _el[_off]?.()
        ),
        console.groupEnd()
      )
    ) :

    // :else :if
    // if there's _holder it means element was initialized by _else before
    (
      _prev = el._prev,
      _holder = el._holder,
      _el = _holder._el,
      // _holder._match ??= signal(1), // _match is supposed to be created by :else
      _holder._match._if = true, // take over control of :else :if branch, make :else handler bypass
      console.log('init elif'),


      // :else may have children to init which is called after :if
      // or preact can schedule :else after :if, so we ensure order of call by next tick
      value => {
        console.group('if->else')
        _holder._match.value = value || _prev._match.value;
        console.groupEnd()

        console.group('elif')

        !_prev._match.value && value ?
          (
            console.log('elif yes', el),
            _holder.before(_el.content || _el),
            _el[_on]?.()
          )
          :
          (
            console.log('elif no', el),
            // FIXME: if we turn off intermediate :else :if conditions, we lose propagation chain.
            // NOTE: it disables everything else except for :if
            _el.remove()//, _el[_off]?.()
          )
        console.groupEnd()
      }
    )
)
