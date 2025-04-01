import { use, effect } from "./signal.js";
import { store, _signals } from './store.js';

// polyfill
export const _dispose = (Symbol.dispose ||= Symbol("dispose"));

export const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')

// registered directives
export const directive = {}

/**
 * Register a directive with a parsed expression and evaluator.
 * @param {string} name - The name of the directive.
 * @param {(el: Element, state: Object, attrValue: string, attrName: string) => (value: any) => void} create - A function to create the directive.
 * @param {(expr: string) => (state: Object) => any} [p=parse] - Create evaluator from expression string.
 */
export const dir = (name, create, p = parse) => directive[name] = (el, expr, state, name, update, evaluate) => (
  evaluate = p(expr),
  update = create(el, state, expr, name, evaluate),
  () => update(evaluate(state))
)

/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} el - The target HTML element to apply directives to.
 * @param {Object} [values] - Initial values to populate the element's reactive state.
 * @returns {Object} The reactive state object associated with the element.
 */
export const sprae = (el, values) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], values)

  // take over existing state instead of creating a clone
  let state = store(values || {}), offs = [], fx = [],

    init = (el, attrs = el.attributes) => {
      // we iterate live collection (subsprae can init args)
      if (attrs) for (let i = 0; i < attrs.length;) {
        let { name, value } = attrs[i], update, dir

        // if we have parts meaning there's attr needs to be spraed
        if (name.startsWith(prefix)) {
          el.removeAttribute(name);

          // multiple attributes like :id:for=""
          for (dir of name.slice(prefix.length).split(':')) {
            update = (directive[dir] || directive.default)(el, value, state, dir)

            // save & start effect
            fx.push(update), offs.push(effect(update))

            // stop after :each, :if, :with etc.
            if (el[_state] === null) return
          }
        } else i++
      }

      // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
      for (let child of el.childNodes) child.nodeType == 1 && init(child)
    };

  init(el);

  // if element was spraed by inline :with instruction (meaning it has extended state) - skip, otherwise save _state
  if (!(_state in el)) {
    el[_state] = state

    // on/off all effects
    el[_off] = () => (offs.map(off => off()), offs = [])
    el[_on] = () => offs = fx.map(f => effect(f))

    // destroy
    el[_dispose] = () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)
  }

  return state;
}

// configure signals/compile
// it's more compact than using sprae.signal = signal etc.
sprae.use = s => (
  s.signal && use(s),
  s.compile && (compile = s.compile),
  s.prefix && (prefix = s.prefix)
)

/**
 * Parses an expression into an evaluator function, caching the result for reuse.
 *
 * @param {string} expr - The expression to parse and compile into a function.
 * @param {string} dir - The directive associated with the expression (used for error reporting).
 * @returns {Function} The compiled evaluator function for the expression.
 */
export const parse = (expr, dir, fn) => {
  if (fn = memo[expr = expr.trim()]) return fn

  // static-time errors
  try { fn = compile(expr) }
  catch (e) { err(e, dir, expr) }

  return memo[expr] = fn
}
const memo = {};

/**
 * Branded sprae error with context about the directive and expression
 *
 * @param {Error} e - The original error object to enhance.
 * @param {string} dir - The directive where the error occurred.
 * @param {string} [expr=''] - The expression associated with the error, if any.
 * @throws {Error} The enhanced error object with a formatted message.
 */
export const err = (e, dir = '', expr = '') => {
  throw Object.assign(e, { message: `∴ ${e.message}\n\n${dir}${expr ? `="${expr}"\n\n` : ""}`, expr })
}

/**
 * Compiles an expression into an evaluator function.
 *
 * @type {(expr: string) => Function}
 */
export let compile

/**
 * Attributes prefix, by default ':'
 */
export let prefix = ':'

// instantiated <template> fragment holder, like persisting fragment but with minimal API surface
export const frag = (tpl) => {
  if (!tpl.nodeType) return tpl // existing tpl

  let content = tpl.content.cloneNode(true),
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
