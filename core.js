import store, { _change, _signals } from "./store.js";

export const _dispose = (Symbol.dispose ||= Symbol("dispose")),
  _state = Symbol("state"),
  _on = Symbol('on'),
  _off = Symbol('off'),
  _add = Symbol('init');

export let prefix = ':', signal, effect, computed, batch = (fn) => fn(), untracked = batch;

export let directive = {}, modifier = {}

let currentDir = null;

/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object|store} [state] - Initial state values to populate the element's reactive state.
 * @returns {Object} The reactive state object associated with the element.
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

        // directive initializer can be redefined
        fx.push(start = dir(el, name.slice(prefix.length), value, state)), offs.push(start())

        // stop after subsprae like :each, :if, :scope etc.
        if (_state in el) return
      } else i++
    }

    // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
    // for (let i = 0, child; i < (el.childNodes.length); i++) child =  el.childNodes[i], child.nodeType == 1 && add(child)
    for (let child of [...el.childNodes]) child.nodeType == 1 && add(child)
  };

  add(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  if (el[_state] === undefined) el[_state] = state

  // console.groupEnd()

  return state;
}

// directive initializer
export let dir

/**
 * Compiles an expression into an evaluator function.
 * @type {(dir:string, expr: string, clean?: string => string) => Function}
 */
export let compile

/**
 * Parses an expression into an evaluator function, caching the result for reuse.
 *
 * @param {string} expr The expression to parse and compile into a function.
 * @returns {Function} The compiled evaluator function for the expression.
 */
export const parse = (expr) => {
  let fn  = cache[expr=expr.trim()]
  if (fn) return fn

  let _expr = expr || 'undefined'

  // if, const, let - no return
  if (/^(if|let|const)\b/.test(_expr) || /;(?![^{]*})/.test(_expr));
  else _expr = `return ${_expr}`

  // async expression
  if (/\bawait\s/.test(_expr)) _expr = `return (async()=>{ ${_expr} })()`

  // static time errors
  try {
    fn = compile(_expr)
    // Object.defineProperty(fn, "name", { value: `∴ ${expr}` })
  } catch (e) { console.error(`∴ ${e}\n\n${currentDir}="${expr}"`) }

  // run time errors
  return cache[expr] = function (state, cb, _out) {
    try {
      let result = fn?.call(this, state)
      // if cb is given (to handle async/await exprs, usually directive update) - call it with result and return a cleanup function
      if (cb) return result?.then ? (result.then(v => _out = cb(v)), () => typeof _out === 'function' && _out()) : cb(result)
      else return result
    } catch (e) {
      console.error(`∴ ${e}\n\n${currentDir}="${expr}"`)
    }
  }
}
const cache = {};



/**
 * Configure sprae
 */
export const use = (s) => (
  s.compile && (compile = s.compile),
  s.prefix && (prefix = s.prefix),
  s.signal && (signal = s.signal),
  s.effect && (effect = s.effect),
  s.computed && (computed = s.computed),
  s.batch && (batch = s.batch),
  s.untracked && (untracked = s.untracked),
  s.dir && (dir = s.dir)
)

// modifier applier
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

// camel to kebab
export const dashcase = (str) => str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? '-' : '') + match.toLowerCase());

// set attr
export const attr = (el, name, v) => (v == null || v === false) ? el.removeAttribute(name) : el.setAttribute(name, v === true ? "" : v);

// convert any-arg to className string
export const clsx = (c, _out = []) => !c ? '' : typeof c === 'string' ? c : (
  Array.isArray(c) ? c.map(clsx) :
    Object.entries(c).reduce((s, [k, v]) => !v ? s : [...s, k], [])
).join(' ')

// throttle function to (once per tick or other custom scheduler)
export const throttle = (fn, schedule = queueMicrotask) => {
  let _planned = 0, arg;
  const throttled = (e) => {
    arg = e
    if (!_planned++) fn(arg), schedule((_dirty = _planned > 1) => (
      _planned = 0, _dirty && throttled(arg)
    ));
  }
  return throttled;
}

export const debounce = (fn, schedule = queueMicrotask, _count = 0) => (arg, _planned = ++_count) => schedule(() => (_planned == _count && fn(arg)))

export * from './store.js';

export default sprae
