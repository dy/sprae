import store from "./store.js";
import { batch, computed, effect, signal, untracked } from './core.js';
import * as signals from './signal.js';
import sprae, { use, decorate, directive, modifier, parse, throttle, debounce, _off, _state, _on, _dispose, _add, call } from './core.js';
import pkg from './package.json' with { type: 'json' };

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
import _seq from "./directive/sequence.js";


Object.assign(directive, {
  _: (el, state, expr, name) => (name.startsWith('on') ? _event : _default)(el, state, expr, name),
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


/**
 * Directive initializer (with modifiers support)
 * @type {(el: HTMLElement, name:string, value:string, state:Object) => Function}
 * */
const dir = (target, name, expr, state) => {
  let [dirName, ...mods] = name.split('.'), create = directive[dirName] || directive._

  return () => {
    let update = create(target, state, expr, name)

    if (!update?.call) return update?.[_dispose]

    // throttle prevents multiple updates within one tick as well as isolates stack for each update
    let trigger = decorate(Object.assign(throttle(() => change.value++), { target }), mods),
      change = signal(0), // signal authorized to trigger effect: 0 = init; >0 = trigger
      count = 0, // called effect count
      evaluate = update.eval ?? parse(expr).bind(target),
      _out, out = () => (_out && call(_out), _out=null) // effect trigger and invoke may happen in the same tick, so it will be effect-within-effect call - we need to store output of evaluate to return from trigger effect

    state =  target[_state] ?? state

    return effect(() => (
      // if planned count is same as actual count - plan new update, else update right away
      change.value == count ? (trigger()) : (count = change.value, _out = evaluate(state, update)),
      out
    ))
  }
}

Object.assign(modifier, {
  // timing (lodash-like)
  // FIXME: add immediate param
  debounce: (fn, _how) => debounce(fn, (_how ||= 0, !_how ? undefined : _how === 'raf' ? requestAnimationFrame : (fn) => setTimeout(fn, _how))),
  throttle: (fn, _how) => throttle(fn, (_how ||= 0, !_how ? undefined : _how === 'raf' ? requestAnimationFrame : (fn) => setTimeout(fn, _how))),
  delay: (fn, ms) => !ms ? (e) => (queueMicrotask(() => fn(e))) : (e) => setTimeout(() => fn(e), ms),

  tick: (fn) => (console.warn('Deprecated'), (e) => (queueMicrotask(() => fn(e)))),
  raf: (fn) => (console.warn('Deprecated'), (e) => requestAnimationFrame(() => fn(e))),

  once: (fn, _done, _fn) => (_fn = (e) => !_done && (_done = 1, fn(e)), _fn.once = true, _fn),

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
  stop: (fn, _how) => (e) => (_how?.[0] === 'i' ? e?.stopImmediatePropagation() : e?.stopPropagation(), fn(e)),
  immediate: (fn) => (console.warn('Deprecated'), (e) => (e?.stopImmediatePropagation(), fn(e))),
  passive: fn => (fn.passive = true, fn),
  capture: fn => (fn.capture = true, fn),
})

// key testers
const keys = {
  ctrl: e => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: e => e.shiftKey || e.key === "Shift",
  alt: e => e.altKey || e.key === "Alt",
  meta: e => e.metaKey || e.key === "Meta",
  cmd: e => e.metaKey || e.key === "Command",
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
for (let k in keys) modifier[k] = (fn, a, b) => (e) => keys[k](e) && (!a || keys[a]?.(e)) && (!b || keys[b]?.(e)) && fn(e)


use({
  compile: expr => sprae.constructor(`with (arguments[0]) { ${expr} }`),
  dir: (el, name, expr, state) => {
    // sequences shortcut
    if (name.includes('..')) return () => _seq(el, state, expr, name)[_dispose]
    return name.split(':').reduce((prev, str) => {
      let start = dir(el, str, expr, state)
      return !prev ? start : (p, s) => (p = prev(), s = start(), () => { p(); s() })
    }, null)
  },
  ...signals
})


// expose for runtime config
sprae.use = use
sprae.store = store
sprae.directive = directive
sprae.modifier = modifier
sprae.version = pkg.version;


/**
 * Lifecycle hanger: spraes automatically any new nodes
 */
const start = sprae.start = (root = document.body, values) => {
  const state = store(values)
  sprae(root, state);
  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const el of m.addedNodes) {
        // el can be spraed or removed by subsprae (like within :each/:if)
        if (el.nodeType === 1 && el[_state] === undefined && root.contains(el)) {
          // even if element has no spraeable attrs, some of its children can have
          root[_add](el)
          // sprae(el, state, root);
        }
      }
      // for (const el of m.removedNodes) el[Symbol.dispose]?.()
    }
  });
  mo.observe(root, { childList: true, subtree: true });
  return state
}


// version placeholder for bundler
sprae.version = "[VI]{{inject}}[/VI]"

export default sprae
export { sprae, store, signal, effect, computed, batch, untracked, start, use }
