import { _state, _dispose, use } from "./core.js"
import directive from "./directive/index.js"
import sprae, { effect, parse, signal } from "./core.js"

// Microsprae.
// No prop mods, sync effects, no aliases, no chains, core effects

use({
  compile: expr => sprae.constructor(`with (arguments[0]) { ${expr} }`),
  dir(target, name, expr, state) {
    let [dirName] = name.split('.'), d = directive[dirName] || directive._

    return (_update, _eval) => (
      (_update = d(target, state, expr, name))[_dispose] ??
      (
        _eval = _update.eval ?? parse(expr),
        state = target[_state] ?? state,
        effect(() => _eval(state, _update))
      )
    )
  }
})

Object.assign(directive, {
  // default handler has syntax sugar: aliasing and sequences, eg. :ona:onb..onc:ond
  _(el, state, expr, name) {
    return (name.startsWith('on') ? _default : _event)(el, state, expr, name)
  },

  '': _spread,
  class: _class,
  text: _text,
  style: _style,
  fx: _fx,
  value: _value,
  ref: _ref,
  scope: _scope,
  if: _if,
  else: _else,
  each: _each
})

export default sprae
