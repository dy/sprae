import { use, effect } from "./signal.js";
import { store } from './store.js';

// polyfill
export const _dispose = (Symbol.dispose ||= Symbol("dispose"));

export const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')

let cur // current directive

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

  console.group('sprae', el)
  // take over existing state instead of creating a clone
  let state = store(values || {}),
    { prefix } = sprae,
    fx = [], fn

  let init = (el, attrs = el.attributes) => {
    // we iterate live collection (subsprae can init args)
    if (attrs) for (let i = 0; i < attrs.length;) {
      let { name, value } = attrs[i]

      if (name.startsWith(prefix)) {
        el.removeAttribute(name)

        // multiple attributes like :id:for=""
        for (cur of name.slice(prefix.length).split(':')) {
          // save effect
          console.group('directive', cur, value);

          let [dirName, ...mods] = cur.split('.'),
            dir = sprae.dir[dirName] || sprae.dir['*'],
            ev = parse(value),
            update = dir(el, value, state, dir)

          if (update) {
            let fn = () => update(ev(state)), name, param
            // apply modifiers to update fn
            for (let mod of mods) [name, param] = mod.split('-'), fn = modifiers[name](fn, param)
            fx.push(fn), offs.push(effect(fn))
          }

          console.groupEnd()

          // stop after :each, :if, :scope etc.
          if (_state in el) return console.log('skip')
        }
      } else i++
    }

    // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
    for (let child of el.childNodes) child.nodeType == 1 && init(child)
  };

  let offs = [],
    on = () => offs = fx.map(effect),
    off = () => (offs.map(off => off()), offs = [])
  // prevOn = el[_on], prevOff = el[_off],

  // on/off all effects
  // FIXME: we're supposed to call prevOn/prevOff, but I can't find a test case. Some combination of :if/:scope/:each/:ref
  el[_on] = on //() => (prevOn?.(), on())
  el[_off] = off //() => (prevOff?.(), off())

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  init(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  if (!(_state in el)) el[_state] = state

  console.groupEnd();

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
 * Attributes prefix
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
export const parse = (expr, _fn) => {
  if (_fn = cache[expr = expr.trim()]) return _fn

  // static time errors
  _fn = safe(() => sprae.compile(expr), expr)()

  // run time errors
  return cache[expr] = safe(_fn, expr)
}

// create wrapped function call
export const safe = (fn, expr, dir = cur) => state => {
  try { return fn?.(state) }
  catch (e) { console.error(`∴ ${e}\n\n${sprae.prefix + dir}="${expr}"`) }
}

export default sprae
