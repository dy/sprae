import { use, effect } from "./signal.js";
import { store } from './store.js';

// polyfill
export const _dispose = (Symbol.dispose ||= Symbol("dispose"));

export const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')

let cur // current directive

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
    { prefix } = sprae,
    fx = []

  let init = (el, attrs = el.attributes) => {
    // we iterate live collection (subsprae can init args)
    if (attrs) for (let i = 0; i < attrs.length;) {
      let { name, value } = attrs[i], update, parts

      // if we have parts meaning there's attr needs to be spraed
      if (name.startsWith(prefix)) {
        el.removeAttribute(name);

        // multiple attributes like :id:for=""
        for (cur of name.slice(prefix.length).split(':')) {
          parts = cur.split('.')
          update = (directive[parts[0]] || directive['*'])(el, value, state, parts)

          // save effect
          fx.push(update)

          // stop after :each, :if, :with etc.
          if (el[_state] === null) return
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
  // FIXME: we're supposed to call prevOn/prevOff, but I can't find a test case. Some combination of :if/:with/:each/:ref
  el[_on] = on //() => (prevOn?.(), on())
  el[_off] = off //() => (prevOff?.(), off())

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  // init
  init(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  if (!(_state in el)) el[_state] = state

  // start local effects
  on()

  return state;
}

/**
 * Compiles an expression into an evaluator function.
 *
 * @type {(expr: string) => Function}
 */
sprae.compile = null

/**
 * Attributes prefix, by default ':'
 */
sprae.prefix = ':'

/**
 * Configure signals
 */
sprae.use = use

/**
 * Register a directive with a parsed expression and evaluator.
 * @param {string} name - The name of the directive.
 * @param {(el: Element, state: Object, expr: string, name: string) => (value: any) => void} create - A function to create the directive.
 * @param {(expr: string) => (state: Object) => any} [p=parse] - Create evaluator from expression string.
 */
sprae.dir = (name, create, p = parse) => directive[name] = (el, expr, state, parts) => {
  const evaluate = p(expr), update = create(el, state, expr, parts)
  return () => update(evaluate(state))
}

export const dir = sprae.dir

// registered directives
export const directive = {}

/**
 * Parses an expression into an evaluator function, caching the result for reuse.
 *
 * @param {string} expr - The expression to parse and compile into a function.
 * @returns {Function} The compiled evaluator function for the expression.
 */
export const parse = (expr, fn) => {
  if (fn = memo[expr = expr.trim()]) return fn

  // static time errors
  fn = safe(() => sprae.compile(expr), cur, expr)()

  // run time errors
  return memo[expr] = safe(fn, cur, expr)
}
const memo = {};

// create wrapped function call
export const safe = (fn, dir, expr) => state => {
  try { return fn?.(state) }
  catch (e) { console.error(`∴ ${e}\n\n${sprae.prefix + dir}="${expr}"`) }
}

// instantiated <template> fragment holder, like persisting fragment but with minimal API surface
export const frag = (tpl) => {
  if (!tpl.nodeType) return tpl // existing tpl

  let content = tpl.content.cloneNode(true), // document fragment holder of content
    attributes = [...tpl.attributes],
    ref = document.createTextNode(''),
    // ensure at least one node
    childNodes = (content.append(ref), [...content.childNodes])

  return {
    // get parentNode() { return childNodes[0].parentNode },
    childNodes,
    content,
    remove: () => content.append(...childNodes),
    replaceWith(el) {
      if (el === ref) return
      ref.before(el)
      content.append(...childNodes)
    },
    attributes,
    removeAttribute(name) { attributes.splice(attributes.findIndex(a => a.name === name), 1) },
    // setAttributeNode() { }
  }
}

export default sprae
