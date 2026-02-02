import store, { _change, _signals } from "./store.js";



/** Symbol for disposal (using standard Symbol.dispose if available) */
export const _dispose = (Symbol.dispose ||= Symbol("dispose"))

/** Symbol for accessing element's reactive state */
export const _state = Symbol("state")

/** Symbol for enabling element effects */
export const _on = Symbol('on')

/** Symbol for disabling element effects */
export const _off = Symbol('off')

/** Symbol for adding child to element */
export const _add = Symbol('init')

/** Directive prefix (default: ':') */
export let prefix = ':';

/**
 * A reactive signal containing a value.
 * @template T
 * @typedef {Object} Signal
 * @property {T} value - Current value (reading subscribes, writing notifies)
 * @property {() => T} peek - Read without subscribing
 * @property {() => T} valueOf - Get value for coercion
 * @property {() => T} toJSON - Get value for JSON serialization
 * @property {() => string} toString - Get value as string
 */

/**
 * Internal effect function type.
 * @typedef {Object} EffectFn
 * @property {Set<Set<EffectFn>>} deps - Dependency sets
 * @property {() => void} fn - Original function
 */

/**
 * Creates a reactive signal.
 * @template T
 * @type {<T>(value: T) => Signal<T>}
 */
export let signal;

/**
 * Creates a reactive effect that re-runs when dependencies change.
 * @type {(fn: () => void | (() => void)) => () => void}
 */
export let effect;

/**
 * Creates a computed signal derived from other signals.
 * @template T
 * @type {<T>(fn: () => T) => Signal<T>}
 */
export let computed;

/**
 * Batches multiple signal updates into a single notification.
 * @template T
 * @type {<T>(fn: () => T) => T}
 */
export let batch = (fn) => fn();

/**
 * Runs a function without tracking signal dependencies.
 * @template T
 * @type {<T>(fn: () => T) => T}
 */
export let untracked = batch;

/**
 * Registry of directive handlers.
 * @type {Record<string, DirectiveHandler>}
 */
export let directive = {};

/**
 * Registry of modifier functions.
 * @type {Record<string, ModifierHandler>}
 */
export let modifier = {}


let currentDir = null;
let currentEl = null;

/**
 * Formats element for error message (minimal context).
 * @param {Element} [el] - Element to format
 * @returns {string} Element hint like "<div#id.class>"
 */
const elHint = (el) => {
  if (!el?.tagName) return ''
  let hint = el.tagName.toLowerCase()
  if (el.id) hint += '#' + el.id
  else if (el.className) hint += '.' + el.className.split(' ')[0]
  return `<${hint}>`
}

/**
 * Reports an error with context.
 * @param {Error|string} e - Error to report
 * @param {string} [expr] - Expression that caused error
 */
const err = (e, expr) => {
  let msg = `∴ ${e}`
  if (currentEl) msg += `\n  in ${elHint(currentEl)}`
  if (currentDir && expr) {
    // Truncate long expressions
    const display = expr.length > 100 ? expr.slice(0, 80) + `… (${expr.length} chars)` : expr
    msg += `\n  ${currentDir}="${display}"`
  }
  console.error(msg)
}

/**
 * @callback DirectiveHandler
 * @param {Element} el - Target element
 * @param {Object} state - Reactive state object
 * @param {string} expr - Expression string
 * @param {string} [name] - Directive name with modifiers
 * @returns {((value: any) => void | (() => void)) | { [Symbol.dispose]: () => void } | void}
 */

/**
 * @callback ModifierHandler
 * @param {Function} fn - Function to modify
 * @param {...string} args - Modifier arguments (from dash-separated values)
 * @returns {Function}
 */

/**
 * @typedef {Object} SpraeState
 * @property {Record<string, Signal>} [_signals] - Internal signals map
 */

/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object} [state] - Initial state values to populate the element's reactive state.
 * @returns {SpraeState & Object} The reactive state object associated with the element.
 */
const sprae = (el = document.body, state) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], state)

  // console.group('sprae', el)

  // take over existing state instead of creating a clone
  state = store(state || {})

  let fx = [], offs = []

  // on/off all effects
  // we don't call prevOn as convention: everything defined before :else :if won't be disabled by :if
  // imagine <x :onx="..." :if="..."/> - when :if is false, it disables directives after :if (calls _off) but ignores :onx
  el[_on] = () => (!offs && (offs = fx.map(fn => fn())))
  el[_off] = () => (offs?.map(off => off()), offs = null)

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_add] = el[_state] = null)

  const add = el[_add] = (el) => {
    let _attrs = el.attributes, start;

    // we iterate live collection (subsprae can init args)
    if (_attrs) for (let i = 0; i < _attrs.length;) {
      let { name, value } = _attrs[i]

      if (name.startsWith(prefix)) {
        el.removeAttribute(name)

        currentDir = name;
        currentEl = el;

        // directive initializer can be redefined
        fx.push(start = dir(el, name.slice(prefix.length), value, state)), offs.push(start())

        // stop after subsprae like :each, :if, :scope etc.
        if (_state in el) return
      } else i++
    }

    // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
    // real DOM: firstChild/nextSibling avoids array copy; frag.childNodes is already snapshot array
    if (el.firstChild !== undefined) {
      let child = el.firstChild, next
      while (child) (next = child.nextSibling, child.nodeType == 1 && add(child), child = next)
    }
    else for (let child of el.childNodes) child.nodeType == 1 && add(child)
  };

  add(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  if (el[_state] === undefined) el[_state] = state

  // console.groupEnd()

  return state;
}

/** Package version (injected by bundler) */
sprae.version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'dev'


// directive initializer
/** @type {(el: Element, name: string, expr: string, state: Object) => () => (() => void) | void} */
export let dir

/**
 * Compiles an expression string into an evaluator function.
 * @type {(expr: string) => (state: Object) => any}
 */
export let compile

/**
 * Parses an expression into an evaluator function, caching the result for reuse.
 *
 * @param {string} expr - The expression to parse and compile into a function.
 * @returns {(state: Object, cb?: (value: any) => any) => any} The compiled evaluator function for the expression.
 */
export const parse = (expr) => {
  let fn  = cache[expr=expr.trim()]
  if (fn) return fn

  // static time errors
  try {
    fn = compile(expr || 'undefined')
    // Object.defineProperty(fn, "name", { value: `∴ ${expr}` })
  } catch (e) { err(e, expr) }

  // run time errors
  return cache[expr] = function (state, cb, _out) {
    try {
      let result = fn?.call(this, state)
      // if cb is given (to handle async/await exprs, usually directive update) - call it with result and return a cleanup function
      if (cb) return result?.then
        ? (result.then(v => _out = cb(v)).catch(e => err(e, expr)), () => typeof _out === 'function' && _out())
        : cb(result)
      else return result
    } catch (e) {
      err(e, expr)
    }
  }
}
const cache = {};


/**
 * @typedef {Object} SpraeConfig
 * @property {(expr: string) => (state: Object) => any} [compile] - Custom expression compiler
 * @property {string} [prefix] - Directive prefix (default: ':')
 * @property {<T>(value: T) => Signal<T>} [signal] - Signal factory
 * @property {(fn: () => void | (() => void)) => () => void} [effect] - Effect factory
 * @property {<T>(fn: () => T) => Signal<T>} [computed] - Computed factory
 * @property {<T>(fn: () => T) => T} [batch] - Batch function
 * @property {<T>(fn: () => T) => T} [untracked] - Untracked function
 * @property {(el: Element, name: string, expr: string, state: Object) => () => (() => void) | void} [dir] - Directive initializer
 */

/**
 * Configure sprae with custom signals, compiler, or prefix.
 * @param {SpraeConfig} config - Configuration options
 * @returns {void}
 */
export const use = (config) => (
  config.compile && (compile = config.compile),
  config.prefix && (prefix = config.prefix),
  config.signal && (signal = config.signal),
  config.effect && (effect = config.effect),
  config.computed && (computed = config.computed),
  config.batch && (batch = config.batch),
  config.untracked && (untracked = config.untracked),
  config.dir && (dir = config.dir)
)

/**
 * Applies modifiers to a function.
 * @param {Function & { target?: Element }} fn - Function to decorate
 * @param {string[]} mods - Modifier names with arguments (e.g., ['throttle-500', 'prevent'])
 * @returns {Function} Decorated function
 */
export const decorate = (fn, mods) => {
  while (mods.length) {
    let [name, ...params] = mods.pop().split('-'), mod = modifier[name], wrapFn
    if (mod) {
      if ((wrapFn = mod(fn, ...params)) !== fn) {
        for (let k in fn) wrapFn[k] ??= fn[k];
        fn = wrapFn
      }
    }
  }
  return fn
}


/** MutationObserver reference, set by sprae.start() */
export let mo = null
/** Pauses MO during DOM mutations to prevent disposing managed elements */
export const mutate = (fn) => { mo?.disconnect(); fn(); mo?.observe(mo._root, { childList: true, subtree: true }) }

/**
 * Auto-initializes sprae on dynamically added elements.
 * Uses MutationObserver to detect new DOM nodes and apply directives.
 *
 * @param {Element} [root=document.body] - Root element to observe
 * @param {Object} [values] - Initial state values
 * @returns {Object} The reactive state object
 *
 * @example
 * ```js
 * // Auto-init on page load
 * sprae.start(document.body, { count: 0 })
 * ```
 */
export const start = (root = document.body, values) => {
  const state = store(values)
  sprae(root, state);
  mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const el of m.addedNodes) {
        // el can be spraed or removed by subsprae (like within :each/:if)
        if (el.nodeType === 1 && el[_state] === undefined && root.contains(el)) {
          // even if element has no spraeable attrs, some of its children can have
          root[_add](el)
        }
      }
      for (const el of m.removedNodes) {
        // Only dispose if element is truly removed from document
        if (el.nodeType === 1 && !root.contains(el)) el[_dispose]?.()
      }
    }
  });
  mo._root = root
  mo.observe(root, { childList: true, subtree: true });
  return state
}

/**
 * @typedef {Object} FragmentLike
 * @property {Node[]} childNodes - Child nodes of the fragment
 * @property {DocumentFragment} content - The document fragment content
 * @property {() => void} remove - Remove the fragment from DOM
 * @property {(el: Node) => void} replaceWith - Replace the fragment with an element
 * @property {Attr[]} attributes - Attributes from the original template
 * @property {(name: string) => void} removeAttribute - Remove an attribute
 */

/**
 * Creates a fragment holder from a template element with minimal API surface.
 * @param {HTMLTemplateElement | FragmentLike} tpl - Template element or existing fragment
 * @returns {FragmentLike} Fragment-like object
 */
export const frag = (tpl) => {
  if (!tpl.nodeType) return tpl // existing tpl

  let content = tpl.content.cloneNode(true), // document fragment holder of content
    attributes = [...tpl.attributes],
    ref = document.createTextNode(''),
    // ensure at least one node
    childNodes = (content.append(ref), [...content.childNodes])

  return {
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
  }
}

/**
 * Converts camelCase to kebab-case.
 * @param {string} str - String to convert
 * @returns {string} Kebab-case string
 */
export const dashcase = (str) => str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? '-' : '') + match.toLowerCase());

/**
 * Sets or removes an attribute on an element.
 * @param {Element} el - Target element
 * @param {string} name - Attribute name
 * @param {string | boolean | null | undefined} v - Attribute value (null/false removes, true sets empty)
 * @returns {void}
 */
export const attr = (el, name, v) => (v == null || v === false) ? el.removeAttribute(name) : el.setAttribute(name, v === true ? "" : v);

/**
 * Converts class input to className string (like clsx/classnames).
 * @param {string | string[] | Record<string, boolean> | null | undefined} c - Class input
 * @returns {string} Space-separated class string
 */
export const clsx = (c, _out = []) => !c ? '' : typeof c === 'string' ? c : (
  Array.isArray(c) ? c.map(clsx) :
    Object.entries(c).reduce((s, [k, v]) => !v ? s : [...s, k], [])
).join(' ')

/**
 * Throttles a function to run at most once per tick (or custom scheduler).
 * Fires on leading edge, then on trailing edge if called during throttle.
 * @template {Function} T
 * @param {T} fn - Function to throttle
 * @param {number|Function} [ms] - Delay in ms or scheduler function (default: microtask)
 * @returns {T} Throttled function
 */
export const throttle = (fn, ms) => {
  let _planned = 0, arg, schedule = typeof ms === 'function' ? ms : ms ? (fn) => setTimeout(fn, ms) : queueMicrotask;
  const throttled = (e) => {
    arg = e
    if (!_planned++) fn(arg), schedule((_dirty = _planned > 1) => (
      _planned = 0, _dirty && throttled(arg)
    ));
  }
  return throttled;
}

/**
 * Debounces a function to run after a delay since the last call.
 * @template {Function} T
 * @param {T} fn - Function to debounce
 * @param {number|Function} [ms] - Delay in ms or scheduler function (default: microtask)
 * @param {boolean} [immediate=false] - Fire on leading edge instead of trailing
 * @returns {T} Debounced function
 */
export const debounce = (fn, ms, immediate) => {
  let schedule = typeof ms === 'function' ? ms : ms ? (fn) => setTimeout(fn, ms) : queueMicrotask;
  return immediate
    ? ((_blocked) => (arg) => !_blocked && (fn(arg), _blocked = 1, schedule(() => _blocked = 0)))()
    : ((_count = 0) => (arg, _c = ++_count) => schedule(() => _c == _count && fn(arg)))()
}

/**
 * Parses time string to milliseconds. Supports: 100, 100ms, 1s, 1m
 * @param {string|number} t - Time value
 * @returns {number} Milliseconds
 */
export * from './store.js';

export default sprae
