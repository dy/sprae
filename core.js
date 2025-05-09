import { use, effect } from "./signal.js";
import { store } from './store.js';

// polyfill
export const _dispose = (Symbol.dispose ||= Symbol("dispose"));

export const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')

// compiled cache
const cache = {};

/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object} [values] - Initial values to populate the element's reactive state.
 * @returns {Object} The reactive state object associated with the element.
 */
export const sprae = (el = document.body, values) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], values)

  // take over existing state instead of creating a clone
  let state = store(values || {}),
    fx = [], offs = [], fn,
    // FIXME: on generally needs to account for events, although we call it only in :if
    on = () => (offs = fx.map(fn => fn())),
    off = () => (offs.map(off => off()), offs = [])
    // prevOn = el[_on], prevOff = el[_off]

  // on/off all effects
  // FIXME: we're supposed to call prevOn/prevOff, but I can't find a test case. Some combination of :if/:scope/:each/:ref
  el[_on] = on// () => (prevOn?.(), on())
  el[_off] = off// () => (prevOff?.(), off())

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  let init = (el, attrs = el.attributes) => {
    // we iterate live collection (subsprae can init args)
    if (attrs) for (let i = 0; i < attrs.length;) {
      let { name, value } = attrs[i]

      // we suppose
      if (name.startsWith(sprae.prefix)) {
        el.removeAttribute(name)

        // directive initializer can be redefined
        fx.push(fn = sprae.init(el, name, value, state)), offs.push(fn())

        // stop after :each, :if, :scope etc.
        if (_state in el) return
      } else i++
    }

    // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
    for (let child of el.childNodes) child.nodeType == 1 && init(child)
  };

  init(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  // FIXME: can check for null instead
  if (!(_state in el)) el[_state] = state

  return state;
}

/** Registered directives */
sprae.dir = {}

/** Registered modifiers */
sprae.mod = {}

/**
 * Compiles an expression into an evaluator function.
 *
 * @type {(expr: string) => Function}
 */
sprae.compile = null

/**
 * Attribute/event prefixes
 */
sprae.prefix = ':'

/**
 * Configure signals
 */
sprae.use = use

/**
 * Parses an expression into an evaluator function, caching the result for reuse.
 *
 * @param {string} expr The expression to parse and compile into a function.
 * @returns {Function} The compiled evaluator function for the expression.
 */
export const parse = (expr, dir, _fn) => {
  if (_fn = cache[expr = expr.trim()]) return _fn

  // static time errors
  _fn = safe(() => sprae.compile(expr), expr, dir)()

  // run time errors
  return cache[expr] = safe(_fn, expr, dir)
}

// create wrapped function call
const safe = (fn, expr, dir) => state => {
  try { return fn?.(state) }
  catch (e) { console.error(`∴ ${e}\n\n${sprae.prefix + dir}="${expr}"`) }
}

export default sprae
