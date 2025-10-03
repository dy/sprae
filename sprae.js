import store, { _change, _signals } from "./store.js";
import { batch, computed, effect, signal, untracked } from './signal.js';
import sprae, { use, dir, _off, _state, _on, _dispose, call, attr, dashcase } from './core.js';

import _if from "./directive/if2.js";
import _else from "./directive/else2.js";
import _text from "./directive/text.js";
import _class from "./directive/class.js";
import _style from "./directive/style.js";
import _fx from "./directive/fx.js";
import _value from "./directive/value.js";
import _ref from "./directive/ref.js";
import _scope from "./directive/scope.js";
import _each from "./directive/each.js";
import _any from "./directive/any.js";
import _spread from "./directive/spread.js";


// standard directives
Object.assign(dir, {
  // :x="x"
  '*': _any,

  // :="{a,b,c}"
  '': _spread,

  // :class="[a, b, c]"
  class: _class,

  // :text="..."
  text: _text,

  // :style="..."
  style: _style,

  // :fx="..."
  fx: _fx,

  // :value - 2 way binding like x-model
  value: _value,

  // :ref="..."
  ref: _ref,

  // :scope creates variables scope for a subtree
  scope: _scope,

  if: _if,
  else: _else,

  // :each="v,k in src"
  each: _each
})

// configure defaults
use({
  // indirect new Function to avoid detector
  compile: expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`),
  signal, effect, computed, batch, untracked
})


export default sprae
export { sprae, store, signal, effect, computed, batch, untracked }
