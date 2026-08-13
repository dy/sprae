/**
 * @fileoverview Sprae - lightweight reactive HTML templating library
 * @module sprae
 */

import store from "./store.js";
import { batch, computed, effect, signal, untracked } from './core.js';
import * as signals from './signal.js';
import sprae, { use, decorate, directive, modifier, parse, throttle, debounce, _off, _state, _on, _dispose, _add, start, isCE } from './core.js';

import _if, { _else } from "./directive/if.js";
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
import _mount from "./directive/mount.js";
import _change from "./directive/change.js";
import _intersect from "./directive/intersect.js";
import _resize from "./directive/resize.js";


// mark observers: they handle own modifiers, bypass reactive plumbing
_mount.observer = _change.observer = true

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
  hidden: _hidden,
  mount: _mount,
  change: _change,
  intersect: _intersect,
  resize: _resize,
})


/**
 * Activates one directive segment on an element; returns the disposer.
 * Registry stays live: the factory resolves fresh on every activation.
 * @param {Element} target - Target element
 * @param {{dirName: string, mods: string[]}} seg - Parsed name segment
 * @param {string} expr - Expression string
 * @param {Object} state - Reactive state object
 * @returns {(() => void) | void} Disposer
 */
const dirRun = (target, seg, expr, state) => {
  let create = directive[seg.dirName] || directive._
  let el = target, update, change, trigger, count = 0

  if (seg.mods.length) {
    // modifiers can retarget the update or schedule it, so they keep the trigger indirection
    change = signal(0)
    trigger = decorate(Object.assign(() => change.value++, { target }), seg.mods.slice())
    el = trigger.target ?? target
  }

  update = create(el, state, expr, seg.dirName)

  if (!update?.call) return update?.[_dispose]

  let evaluate = update.eval ?? parse(expr),
    _out, out // effect trigger and invoke may happen in the same tick (effect-within-effect) - stores evaluate output to return from trigger effect

  // use element's own state for expression evaluation, unless it's a custom element
  // (custom elements: directives are parent prop setters, must evaluate against parent state)
  if (!isCE(el)) state = el[_state] ?? state

  let off = change ? (out = () => (typeof _out === 'function' && _out(), _out = null), effect(() => {
    change.value == count ? trigger() : (count = change.value, _out = evaluate.call(el, state, update))
    return out
  })) : effect(() => (_out = evaluate.call(el, state, update),
    // teardown closure exists only once an expression actually yields a cleanup (async/:fx) — most never do
    typeof _out === 'function' ? out ||= () => (typeof _out === 'function' && _out(), _out = null) : void 0))
  if (!(_state in el)) return off
  let _d = 0
  return () => { if (_d) return; _d = 1; off(); update[_off] ? update[_off]() : el[_dispose]?.() }
}

// events and observers handle own modifiers, return dispose
const seg1 = (el, seg, expr, state) => {
  let obs = directive[seg.dirName]
  return seg.on ? _event(el, state, expr, seg.str)
    : obs?.observer ? obs(el, state, expr, seg.str)[_dispose]
    : dirRun(el, seg, expr, state)
}

// per-name parse memo: the same few attr names repeat across every :each row
const recipes = {}
const recipe = (name) => recipes[name] ??=
  name.includes('..') ? 0 : // sequence marker
  name.split(':').map(str => {
    let [dirName, ...mods] = str.split('.')
    return { str, dirName, mods, on: str.startsWith('on') }
  })

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
  /** Triggers when event is outside the element. Ignores drag-out (pointerdown inside, pointerup outside). */
  away: (fn, _pd) => {
    let doc = fn.target.ownerDocument, pdHandler = e => _pd = e.target, _skip = doc.currentEvent || doc.defaultView?.event
    doc.addEventListener('pointerdown', pdHandler, true)
    return Object.assign(
      (e) => e !== _skip && !fn.target.contains(e.type === 'click' ? _pd ?? e.target : e.target) && e.target.isConnected && fn(e),
      { target: doc, [_dispose]: () => doc.removeEventListener('pointerdown', pdHandler, true) }
    )
  },

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
/** Shortcuts for .delay-tick / .delay-raf */
modifier.tick = fn => modifier.delay(fn)
modifier.raf = fn => modifier.delay(fn, 'raf')

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
  arrow: e => e.key?.startsWith("Arrow"),
  enter: e => e.key === "Enter",
  esc: e => e.key?.startsWith("Esc"),
  tab: e => e.key === "Tab",
  space: e => e.key === " " || e.key === "Space" || e.key === " ",
  delete: e => e.key === "Delete" || e.key === "Backspace",
  digit: e => /^\d$/.test(e.key),
  letter: e => /^\p{L}$/gu.test(e.key),
  char: e => /^\S$/.test(e.key),
};

// match key by name, or by e.key (case-insensitive), or by keyCode (digits)
const keyMatch = (k, e) => keys[k]?.(e) || e.key?.toLowerCase() === k || e.keyCode == k

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

// Words that cannot (or must not) become destructuring bindings
const RESERVED = new Set('true,false,null,undefined,this,typeof,instanceof,in,of,new,void,return,function,class,const,let,var,if,else,for,while,do,switch,case,default,break,continue,try,catch,finally,throw,yield,async,await,delete,with,super,import,export,extends,arguments'.split(','))

// `with(scope)` disables identifier caching for the whole function — every read is a dynamic runtime
// lookup, on every run of every effect. For gated read-only expressions we compile a destructured
// prologue instead: identifiers become plain property reads V8 can optimize. Resolution is equivalent —
// scope `has` always answers true and `get` falls through row → state → globalThis, exactly like `with`.
// Gates (fall back to `with`): assignments/inc/dec (scope writes need the trap), ternaries/short-circuits
// (destructuring would read both branches eagerly), templates/regex/semicolons (tokenizer simplicity).
const destructurable = expr => !/(?<![=!<>])=(?![=>])|\+\+|--|\?(?!\.)|&&|\|\||[;`/]|\bdelete\b/.test(expr)

// Free identifier candidates: skip strings, property access (after `.`), numeric tails, reserved words,
// and object keys (`name:` can only be a key — ternaries are gated out). Over-extraction is harmless:
// the extra name resolves through the same scope chain a `with` lookup would.
const free = expr => {
  let names = new Set, i = 0, n = expr.length, last = '', ch, j, k, word
  while (i < n) {
    ch = expr[i]
    if (ch === '"' || ch === "'") { i++; while (i < n && expr[i] !== ch) i += expr[i] === '\\' ? 2 : 1; i++; last = ch; continue }
    if (/[A-Za-z_$]/.test(ch)) {
      j = i
      while (j < n && /[\w$]/.test(expr[j])) j++
      word = expr.slice(i, j)
      if (last !== '.' && !/\d/.test(last) && !RESERVED.has(word)) {
        k = j
        while (k < n && /\s/.test(expr[k])) k++
        if (expr[k] !== ':') names.add(word)
      }
      i = j; last = word[word.length - 1]; continue
    }
    if (!/\s/.test(ch)) last = ch
    i++
  }
  return names
}

// Configure sprae with default compiler and signals
use({

// Default compiler wraps expression for new Function
  compile: expr => {
    // if, const, let - no return
    if (/^(if|let|const)\b/.test(expr));
    // first-level semicolons - no return
    else if (hasSemi(expr));
    else {
      if (destructurable(expr)) try {
        let names = free(expr)
        return sprae.constructor(`${names.size ? `const{${[...names].join(',')}}=arguments[0];` : ''}return(${expr})`)
      } catch (e) { } // odd extraction → with-mode
      expr = `return ${expr}`
    }
    // async expression
    if (/\bawait\s/.test(expr)) expr = `return (async()=>{${expr}})()`
    return sprae.constructor(`with(arguments[0]){${expr}}`)
  },
  // these 2 exceptions might look inconsistent, but arguably that's the cleanest way to avoid coupling
  // activates all segments of a directive name; returns composed disposer
  dir: (el, name, expr, state) => {
    let segs = recipe(name)
    // sequences: handle own modifiers, return dispose
    if (!segs) return _seq(el, state, expr, name)[_dispose]
    // single directive (the common case)
    if (segs.length === 1) return seg1(el, segs[0], expr, state)
    let offs = segs.map(seg => seg1(el, seg, expr, state))
    return (final) => { for (let o of offs) o?.(final) }
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
