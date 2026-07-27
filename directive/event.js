import { parse, decorate } from "../core.js"

/**
 * Event directive - attaches event listeners with modifiers.
 * Syntax: `:onclick="handler"` or `:onclick.prevent.stop="handler"`
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Handler expression
 * @param {string} name - Event name with modifiers (e.g., 'onclick.prevent')
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
// per-name parse memo: the same few event names repeat across every :each row
const names = {}

export default (el, state, expr, name) => {
  // wrap inline cb into function
  // if (!/^(?:[\w$]+|\([^()]*\))\s*=>/.test(expr) && !/^function\b/.test(expr)) expr = `()=>{${expr}}`;

  const [type, mods] = names[name] ??= (([t, ...m]) => [t, m])(name.slice(2).split('.')),
    evaluate = parse(expr)

  // Bare local events need no decoration indirection.
  if (!mods.length) {
    let live = true
    const listener = e => live && evaluate.call(el, state, (fn) => typeof fn === 'function' ? fn(e) : fn)
    el.addEventListener(type, listener)
    return {
      [Symbol.dispose](final) {
        live = false
        if (!final) el.removeEventListener(type, listener)
      }
    }
  }

  // decorate pops mods — pass a copy to keep the memo intact
  const trigger = decorate(Object.assign(e => evaluate.call(el, state, (fn) => typeof fn === 'function' ? fn(e) : fn), { target: el }), [...mods]),
    // stable dispatcher: dispose neutralizes by nulling — removeEventListener is undo work a dying node doesn't need
    handler = e => live && live(e)
  let live = trigger

  trigger.target.addEventListener(type, handler, trigger)
  return {
    [Symbol.dispose](final) {
      live = null
      // final dispose on own element: inert listener dies with the node; always release retargeted (window/document/…)
      if (!final || trigger.target !== el) trigger.target.removeEventListener(type, handler)
      trigger[Symbol.dispose]?.()
    }
  }
}
