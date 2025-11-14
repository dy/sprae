// Microsprae.
// No prop mods, sync effects, no aliases, no chains, core effects

import sprae, { effect, parse, _state, _dispose, use, directive, store } from "./core.js"

import _if from "./directive/if.js";
import _else from "./directive/else.js";
import _text from "./directive/text.js";
import _class from "./directive/class.js";
import _style from "./directive/style.js";
import _fx from "./directive/fx.js";
import _value from "./directive/value.js";
import _ref from "./directive/ref.js";
import _scope from "./directive/scope.js";
import _each from "./directive/each.js";
import _default from "./directive/_.js";
import _spread from "./directive/spread.js";
import _event from "./directive/event.js";


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
  // _: (el, state, expr, name) => (name.startsWith('on') ? _default : _event)(el, state, expr, name),
  _: _default,
  // '': _spread,
  class: _class,
  text: _text,
  // style: _style,
  fx: _fx,
  // value: _value,
  ref: _ref,
  // scope: _scope,
  // if: _if,
  // else: _else,
  // each: _each
})


export { sprae, store }

export default sprae
