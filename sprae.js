import store from "./store.js";
import { batch, computed, effect, signal, untracked } from './signal.js';
import sprae, { use, directive, modifier, start, throttle, debounce, _off, _state, _on, _dispose } from './core.js';

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
import _default from "./directive/default.js";
import _spread from "./directive/spread.js";


Object.assign(directive, {
  // :x="x"
  '*': _default,

  // FIXME
  // 'on*': _on,

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

Object.assign(modifier, {
  // timing
  debounce: (fn, _how = 250) => debounce(fn, (_how ||= 0, (fn) => setTimeout(fn, _how))),
  throttle: (fn, _how = 250) => throttle(fn, (_how ||= 0, (fn) => setTimeout(fn, _how))),
  tick: (fn) => (e) => queueMicrotask(() => fn(e)),
  raf: (fn) => (e) => requestAnimationFrame(() => fn(e)),
  once: (fn, _done, _fn) => Object.assign((e) => !_done && (_done = 1, fn(e)), { once: true }),

  // target
  window: fn => (fn.target = fn.target.ownerDocument.defaultView, fn),
  document: fn => (fn.target = fn.target.ownerDocument, fn),
  root: fn => (fn.target = fn.target.ownerDocument.documentElement, fn),
  body: fn => (fn.target = fn.target.ownerDocument.body, fn),
  parent: fn => (fn.target = fn.target.parentNode, fn),
  self: (fn) => (e) => (e.target === fn.target && fn(e)),
  outside: (fn) => (e, _target) => (
    _target = fn.target,
    !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight)
  ),

  // events
  prevent: (fn) => (e) => (e?.preventDefault(), fn(e)),
  stop: (fn) => (e) => (e?.stopPropagation(), fn(e)),
  immediate: (fn) => (e) => (e?.stopImmediatePropagation(), fn(e)),
  passive: fn => (fn.passive = true, fn),
  capture: fn => (fn.capture = true, fn),
})

// key testers
const keys = {
  ctrl: e => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: e => e.shiftKey || e.key === "Shift",
  alt: e => e.altKey || e.key === "Alt",
  meta: e => e.metaKey || e.key === "Meta" || e.key === "Command",
  arrow: e => e.key.startsWith("Arrow"),
  enter: e => e.key === "Enter",
  esc: e => e.key.startsWith("Esc"),
  tab: e => e.key === "Tab",
  space: e => e.key === " " || e.key === "Space" || e.key === " ",
  delete: e => e.key === "Delete" || e.key === "Backspace",
  digit: e => /^\d$/.test(e.key),
  letter: e => /^\p{L}$/gu.test(e.key),
  char: e => /^\S$/.test(e.key),
};

// augment modifiers with key testers
for (let k in keys) modifier[k] = (fn, ...params) => (e) => keys[k](e) && params.every(k => keys[k]?.(e) ?? e.key === k) && fn(e)

use({
  compile: expr => {
    return sprae.constructor(`with (arguments[0]) { ${expr} }`)
  },

  // signals
  signal, effect, computed, batch, untracked
})

// expose for runtime config
sprae.use = use
sprae.store = store
sprae.directive = directive
sprae.modifier = modifier
sprae.start = start

// version placeholder for bundler
sprae.version = "[VI]{{inject}}[/VI]"

export default sprae
export { sprae, store, signal, effect, computed, batch, untracked, start, use }
