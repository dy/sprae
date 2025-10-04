import store, { _change, _signals } from "./store.js";
import { batch, computed, effect, signal, untracked } from './signal.js';
import sprae, { use, _off, _state, _on, _dispose } from './core.js';

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


const directive =  {
  // :x="x"
  '*': _default,

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
}


const modifier = {
  // FIXME: add -s, -m, -l classes with values
  debounce: (fn, wait = 108, _t) => e => (clearTimeout(_t), _t = setTimeout(() => (fn(e)), wait)),
  once: (fn, _done) => Object.assign((e) => !_done && (_done = 1, fn(e)), { once: true }),

  throttle: (fn, limit = 108, _pause, _planned, _t, _block) => (
    _block = (e) => (
      _pause = 1,
      _t = setTimeout(() => (
        _pause = 0,
        // if event happened during blocked time, it schedules call by the end
        _planned && (_planned = 0, _block(e), fn(e))
      ), limit)
    ),
    e => _pause ? _planned = 1 : (_block(e), fn(e))
  ),

  // make batched
  tick: (fn, _planned) => (e) => !_planned && (_planned = 1, queueMicrotask(() => (fn(e), _planned = 0))),

  // FIXME
  interval: (ctx, interval = 1080, _id, _cancel) => (a) => (_id = setInterval(() => _cancel = fn(a), interval), () => (clearInterval(_id), call(_cancel))),
  raf: (ctx, _cancel, _id, _tick) => (_tick = a => (_cancel = fn(a), _id = requestAnimationFrame(_tick)), a => (_tick(a), () => (cancelAnimationFrame(_id), call(_cancel)))),
  idle: (ctx, _id, _cancel) => (a) => (_id = requestIdleCallback(() => _cancel = fn(a), interval), () => (cancelIdleCallback(_id), call(_cancel))),

  emit: (fn) => (e) => e ? fn(e) : (fn.target.dispatchEvent(e = new CustomEvent(fn.type, { bubbles: true, cancelable: true })), !e.defaultPrevented && fn()),
  // FIXME:
  // async: (fn) => (fn.async = true, fn),

  // event modifiers
  // actions
  prevent: (fn) => (e) => (e?.preventDefault(), fn(e)),
  stop: (fn) => (e) => (e?.stopPropagation(), fn(e)),
  immediate: (fn) => (e) => (e?.stopImmediatePropagation(), fn(e)),

  // options
  passive: fn => (fn.passive = true, fn),
  capture: fn => (fn.capture = true, fn),

  // target
  window: fn => (fn.target = window, fn),
  document: fn => (fn.target = document, fn),
  parent: fn => (fn.target = fn.target.parentNode, fn),

  // test
  self: (fn) => (e) => (e.target === fn.target && fn(e)),
  // FIXME
  outside: (fn) => (e, _target) => (
    _target = fn.target,
    !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight)
  ),

  // FIXME:
  //screen: fn => ()
}

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
  directive,
  modifier,

  // indirect new Function to avoid detector
  compile: expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`),

  // signals
  signal, effect, computed, batch, untracked
})



export default sprae
export { sprae, store, signal, effect, computed, batch, untracked }
