import { use, effect } from "./signal.js";
import store, { _signals } from './store.js';

// polyfill
const _dispose = (Symbol.dispose ||= Symbol("dispose"));

export const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')

// registered directives
const directive = {}

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
export default function sprae(el, values) {
  // text nodes, comments etc
  if (!el?.childNodes) return

  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], values)

  // take over existing state instead of creating a clone
  const state = store(values || {}), offs = [], fx = []

  const init = el => {
    // ignore text nodes, comments etc
    if (!el.childNodes) return

    for (let i = 0; i < el.attributes?.length;) {
      let attr = el.attributes[i], update;

      if (attr.name[0] === ':') {
        el.removeAttribute(attr.name);

        // multiple attributes like :id:for=""
        for (let name of attr.name.slice(1).split(':')) {
          update = (directive[name] || directive.default)(el, attr.value, state, name)

          // save & start effect
          fx.push(update), offs.push(effect(update))

          // stop after :each, :if, :with etc.
          if (el[_state]===null) return
        }
      } else i++;
    }

    for (let child of [...el.childNodes]) init(child);
  };

  init(el);

  // if element was spraed by inline :with instruction (meaning it has extended state) - skip, otherwise save _state
  if (!(_state in el)) {
    el[_state] = state

    // on/off all effects
    el[_off] = () => { while (offs.length) offs.pop()() }
    el[_on] = () => offs.push(...fx.map(f => effect(f)))

    // destroy
    el[_dispose] = () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)
  }

  return state;
}

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
export const err = (e, dir='', expr='') => {
  throw Object.assign(e, { message: `∴ ${e.message}\n\n${dir}${expr ? `="${expr}"\n\n` : ""}`, expr })
}

/**
 * Compiles an expression into an evaluator function.
 *
 * @type {(expr: string) => Function}
 */
export let compile

// configure signals/compile
// it's more compact than using sprae.signal = signal etc.
sprae.use = s => {
  s.signal && use(s);
  s.compile && (compile = s.compile);
}


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
