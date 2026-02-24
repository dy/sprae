/**
 * @fileoverview Sprae - lightweight reactive HTML templating library
 * @module sprae
 */

import store from "./store.js";
import { batch, computed, effect, signal, untracked } from './core.js';
import * as signals from './signal.js';
import sprae, { use, decorate, directive, modifier, parse, throttle, debounce, _off, _state, _on, _dispose, _add, start } from './core.js';

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
import _html from "./directive/html.js";
import _portal from "./directive/portal.js";
import _hidden from "./directive/hidden.js";


Object.assign(directive, {
  _: _default,
  '': _spread,
  class: _class,
  text: _text,
  html: _html,
  style: _style,
  fx: _fx,
  value: _value,
  ref: _ref,
  scope: _scope,
  if: _if,
  else: _else,
  each: _each,
  portal: _portal,
  hidden: _hidden
})


/**
 * Directive initializer with modifiers support.
 * @param {Element} target - Target element
 * @param {string} name - Directive name with modifiers (e.g., 'onclick.throttle-500')
 * @param {string} expr - Expression string
 * @param {Object} state - Reactive state object
 * @returns {() => (() => void) | void} Initializer function that returns a disposer
 */
const dir = (target, name, expr, state) => {
  let [dirName, ...mods] = name.split('.'), create = directive[dirName] || directive._

  return () => {
    // decorate trigger to resolve target from modifiers (parent, root, body, etc.)
    let change = signal(0),

      // throttle prevents multiple updates within one tick as well as isolates stack for each update
      trigger = decorate(Object.assign(throttle(() => change.value++), { target }), mods),

      el = trigger.target ?? target

    let update = create(el, state, expr, dirName)

    if (!update?.call) return update?.[_dispose]

    let count = 0,
      evaluate = update.eval ?? parse(expr).bind(el),
      _out, out = () => (typeof _out === 'function' && _out(), _out=null) // effect trigger and invoke may happen in the same tick, so it will be effect-within-effect call - we need to store output of evaluate to return from trigger effect

    state = el[_state] ?? state

    return effect(() => {
      const result = change.value == count ? (trigger()) : (count = change.value, _out = evaluate(state, update))
      return out
    })
  }
}

// Parses time string to ms: 100, 100ms, 1s, 1m
const parseTime = (t) => !t ? 0 : typeof t === 'number' ? t :
  (([, n, u] = t.match(/^(\d+)(ms|s|m)?$/) || []) => (n = +n, u === 's' ? n * 1000 : u === 'm' ? n * 60000 : n))()

// Creates scheduler from time/keyword (idle, raf, tick, or ms)
const scheduler = (t) =>
  t === 'idle' ? requestIdleCallback :
  t === 'raf' ? requestAnimationFrame :
  !t || t === 'tick' ? queueMicrotask :
  (fn) => setTimeout(fn, parseTime(t))

// Built-in modifiers for timing, targeting, and event handling
Object.assign(modifier, {
  /**
   * Delays callback by interval since last call (trailing edge).
   * Supports: tick (default), raf, idle, N, Nms, Ns, Nm. Add -immediate for leading edge.
   * Examples: .debounce, .debounce-100, .debounce-1s, .debounce-raf, .debounce-idle, .debounce-100-immediate
   */
  debounce: (fn, a, b) => debounce(fn, scheduler(a === 'immediate' ? b : a), a === 'immediate' || b === 'immediate'),
  /**
   * Limits callback rate to interval (leading + trailing edges).
   * Supports: tick (default), raf, idle, N, Nms, Ns, Nm.
   * Examples: .throttle, .throttle-100, .throttle-1s, .throttle-raf, .throttle-idle
   */
  throttle: (fn, a) => throttle(fn, scheduler(a)),
  /** Runs callback after delay. Supports: tick (default), raf, idle, N, Nms, Ns, Nm. */
  delay: (fn, a) => ((sched = scheduler(a)) => (e) => sched(() => fn(e)))(),
  /** Shortcut for delay-tick (next microtask). */
  tick: (fn) => (e) => queueMicrotask(() => fn(e)),
  /** Shortcut for delay-raf (next animation frame). */
  raf: (fn) => (e) => requestAnimationFrame(() => fn(e)),

  /** Calls handler only once. */
  once: (fn, _done, _fn) => (_fn = (e) => !_done && (_done = 1, fn(e)), _fn.once = true, _fn),

  /** Attaches event listener to window. */
  window: fn => (fn.target = fn.target.ownerDocument.defaultView, fn),
  /** Attaches event listener to document. */
  document: fn => (fn.target = fn.target.ownerDocument, fn),
  /** Attaches event listener to document root element (<html>). */
  root: fn => (fn.target = fn.target.ownerDocument.documentElement, fn),
  /** Attaches event listener to body. */
  body: fn => (fn.target = fn.target.ownerDocument.body, fn),
  /** Attaches event listener to parent element. */
  parent: fn => (fn.target = fn.target.parentNode, fn),
  /** Triggers only when event target is the element itself. */
  self: (fn) => (e) => (e.target === fn.target && fn(e)),
  /** Triggers when click is outside the element. */
  away: (fn) => Object.assign((e) => (!fn.target.contains(e.target) && e.target.isConnected && fn(e)), {target: fn.target.ownerDocument}),

  /** Calls preventDefault() before handler. */
  prevent: (fn) => (e) => (e?.preventDefault(), fn(e)),
  /** Calls stopPropagation() or stopImmediatePropagation() (with -immediate). */
  stop: (fn, _how) => (e) => (_how?.[0] === 'i' ? e?.stopImmediatePropagation() : e?.stopPropagation(), fn(e)),
  /** Sets passive option for event listener. */
  passive: fn => (fn.passive = true, fn),
  /** Sets capture option for event listener. */
  capture: fn => (fn.capture = true, fn),
})
/** Alias for .away modifier */
modifier.outside = modifier.away

/**
 * Key testers for keyboard event modifiers.
 * @type {Record<string, (e: KeyboardEvent) => boolean>}
 */
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

// match key by name, or by e.key (case-insensitive), or by keyCode (digits)
const keyMatch = (k, e) => keys[k]?.(e) || e.key.toLowerCase() === k || e.keyCode == k

// Augment modifiers with key testers (e.g., .enter, .ctrl, .ctrl-a, .ctrl-65)
for (let k in keys) modifier[k] = (fn, a, b) => (e) => keys[k](e) && (!a || keyMatch(a, e)) && (!b || keyMatch(b, e)) && fn(e)


// Checks for first-level semicolons (statement vs expression)
const hasSemi = s => {
  let d = 0, q = '', esc = 0
  for (let ch of s) {
    if (q) {
      if (esc) esc = 0
      else if (ch === '\\') esc = 1
      else if (ch === q) q = ''
      continue
    }
    if (ch === ';' && !d) return true
    if (ch === '{') d++
    else if (ch === '}') d--
    else if (ch === '"' || ch === "'" || ch === '`') q = ch
  }
  return false
}

// Configure sprae with default compiler and signals
use({

// Default compiler wraps expression for new Function
  compile: expr => {
    // if, const, let - no return
    if (/^(if|let|const)\b/.test(expr));
    // first-level semicolons - no return
    else if (hasSemi(expr));
    else expr = `return ${expr}`
    // async expression
    if (/\bawait\s/.test(expr)) expr = `return (async()=>{${expr}})()`
    return sprae.constructor(`with(arguments[0]){${expr}}`)
  },
  // these 2 exceptions might look inconsistent, but arguably that's the cleanest way to avoid coupling
  dir: (el, name, expr, state) => {
    // sequences: handle own modifiers, return dispose
    if (name.includes('..')) return () => _seq(el, state, expr, name)[_dispose]
    return name.split(':').reduce((prev, str) => {
      // events: handle own modifiers, return dispose
      let start = str.startsWith('on') ? () => _event(el, state, expr, str)[_dispose] : dir(el, str, expr, state)
      return !prev ? start : (p, s) => (p = prev(), s = start(), () => { p(); s() })
    }, null)
  },
  ...signals
})


// Expose for runtime configuration
sprae.use = use
sprae.store = store
sprae.directive = directive
sprae.modifier = modifier

/**
 * Disposes a spraed element, cleaning up all effects and state.
 * @param {Element} el - Element to dispose
 */
const dispose = sprae.dispose = (el) => el[_dispose]?.()


sprae.start = start

export default sprae
export { sprae, store, signal, effect, computed, batch, untracked, start, use, throttle, debounce, dispose }
