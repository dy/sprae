import { parse, decorate } from "../core.js"

/**
 * Event directive - attaches event listeners with modifiers.
 * Syntax: `:onclick="handler"` or `:onclick.prevent.stop="handler"`
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Event name with modifiers (e.g., 'onclick.prevent')
 * @returns {(final?: boolean) => void} Disposer
 */
// per-name parse memo: the same few event names repeat across every :each row
const names = {}

/** Evaluation state for shared listeners, stashed on the element (null = disposed) */
const _estate = Symbol('estate')

// shared listener per (event name + expr): rows reuse one function, state resolves via element
// (listener is attached to the element itself, so currentTarget === el on any dispatch)
const listeners = {}
const listener = (name, expr, key = name + '\0' + expr) => listeners[key] ??= (
  (evaluate = parse(expr)) => function (e) {
    let state = this[_estate]
    state && evaluate.call(this, state, (fn) => typeof fn === 'function' ? fn(e) : fn)
  })()

export default (el, state, expr, name) => {
  // wrap inline cb into function
  // if (!/^(?:[\w$]+|\([^()]*\))\s*=>/.test(expr) && !/^function\b/.test(expr)) expr = `()=>{${expr}}`;

  const [type, mods] = names[name] ??= (([t, ...m]) => [t, m])(name.slice(2).split('.'))

  // Bare local events share one listener function per (name, expr) — no per-element closure.
  if (!mods.length) {
    const fn = listener(name, expr)
    el[_estate] = state
    el.addEventListener(type, fn)
    // final dispose on own element: null eval state, inert listener dies with the node
    return (final) => final ? el[_estate] = null : el.removeEventListener(type, fn)
  }

  const evaluate = parse(expr),
    // decorate pops mods — pass a copy to keep the memo intact
    trigger = decorate(Object.assign(e => evaluate.call(el, state, (fn) => typeof fn === 'function' ? fn(e) : fn), { target: el }), [...mods]),
    // stable dispatcher: dispose neutralizes by nulling — removeEventListener is undo work a dying node doesn't need
    handler = e => live && live(e)
  let live = trigger

  trigger.target.addEventListener(type, handler, trigger)
  return (final) => {
    live = null
    // final dispose on own element: inert listener dies with the node; always release retargeted (window/document/…)
    if (!final || trigger.target !== el) trigger.target.removeEventListener(type, handler)
    trigger[Symbol.dispose]?.()
  }
}
