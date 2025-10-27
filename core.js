import store, { _change, _signals } from "./store.js";
import pkg from './package.json' with { type: 'json' };

export const _dispose = (Symbol.dispose ||= Symbol("dispose")),
  _state = Symbol("state"),
  _on = Symbol('on'),
  _off = Symbol('off')


export let prefix = ':', signal, effect, computed, batch = (fn) => fn(), untracked = batch;

export let directive = {}, modifier = {}

let currentDir = null;

/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object|store} [state] - Initial state values to populate the element's reactive state.
 * @param {Element} [root] - The root element for shared lifecycle management.
 * @returns {Object} The reactive state object associated with the element.
 */
const sprae = (el = document.body, state, root) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], state)

  // console.group('sprae', el)

  // take over existing state instead of creating a clone
  state = store(state || {})

  let fx = [], offs = []

  // on/off all effects
  // we don't call prevOn as convention: everything defined before :else :if won't be disabled by :if
  // imagine <x :onx="..." :if="..."/> - when :if is false, it disables directives after :if (calls _off) but ignores :onx
  el[_on] = root ? root[_on] : () => (!offs && (offs = fx.map(fn => fn())))
  el[_off] = root ? root[_off] : () => (offs?.map(off => off()), offs = null)

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  const add = (el) => {
    let _attrs = el.attributes, fn;

    // we iterate live collection (subsprae can init args)
    if (_attrs) for (let i = 0; i < _attrs.length;) {
      let { name, value } = _attrs[i]

      if (name.startsWith(prefix)) {
        el.removeAttribute(name)

        // directive initializer can be redefined
        if (fn = initDirective(el, name, value, state)) fx.push(fn), offs.push(fn())

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

sprae.version = pkg.version;

/**
 * Initializes directive (defined by sprae build), returns "on" function that enables it
 * Multiprop sequences initializer, eg. :a:b..c:d
 * @type {(el: HTMLElement, name:string, value:string, state:Object) => Function}
 * */
const initDirective = (el, dirName, expr, state) => {
  let cur, // current step callback
    off // current step disposal

  let steps = dirName.slice(prefix.length).split('..').map((step, i, { length }) => (
    // multiple attributes like :id:for=""
    step.split(prefix).reduce((prev, str) => {
      let [name, ...mods] = str.split('.');
      let evaluate = parse(expr, directive[currentDir = name]?.parse)

      // a hack, but events have no signal-effects and can be sequenced
      // FIXME: events are molded into core, but should be an optional directive
      if (name.startsWith('on')) {
        let type = name.slice(2),
          fn = applyMods(
            sx(
              // single event vs chain
              length == 1 ?  e => evaluate(state, (fn) => call(fn, e)) :
                (e => (cur = (!i ?  e => call(evaluate(state), e) : cur)(e), off(), off = steps[(i + 1) % length]())),
              { target: el }
            ),
            mods);

        return (_poff) => (_poff = prev?.(), fn.target.addEventListener(type, fn, fn), () => (_poff?.(), fn.target.removeEventListener(type, fn)))
      }

      let fn, dispose, change, count;

      if (mods.length) {
        change = signal(-1), // signal authorized to trigger effect: 0 = init; >0 = trigger
        count = -1 // called effect count

        // effect applier - first time it applies the effect, next times effect is triggered by change signal
        fn = applyMods(sx(throttle(() => {
            if (++change.value) return // all calls except for the first one are handled by effect
            dispose = effect(() => update && (
              change.value == count ? fn() : // plan update: separate tick (via throttle) makes sure planner effect call is finished before eval call
                (count = change.value, evaluate(state, update)) // if changed more than effect called - call it
            ));
          }), {target: el}), mods)
      }
      else {
        fn = sx(() => dispose = effect(() =>  evaluate(state, update)), {target: el })
      }

      // props have no sequences and can be sync
      // it's nice to see directive as taking some part of current context and returning new or updated context
      let update = (directive[name] || directive['*'])(fn.target, state, expr, name)

      // some directives are effect-less
      if (!update) return

      // take over state if directive created it (mainly :scope)
      if (el[_state]) state = el[_state]

      return (_poff) => (
        _poff = prev?.(),
        // console.log('ON', name),
        fn(),
        () => (
          // console.log('OFF', name, el),
          _poff?.(), dispose?.(), change && (change.value = -1, count = dispose = null)
        )
      )
    }, null)
  ));

  // off can be changed on the go
  return () => (off = steps[0]?.())
}


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
  s.untracked && (untracked = s.untracked)
)


/**
 * Lifecycle hanger: spraes automatically any new nodes
 */
export const start = (root = document.body, values) => {
  const state = store(values)
  sprae(root, state);
  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const el of m.addedNodes) {
        // console.log('mut added el', el, el[_state])
        // el can be spraed or removed by subsprae (like within :each/:if)
        if (el.nodeType === 1 && el[_state] === undefined) {
          for (const attr of el.attributes) {
            if (attr.name.startsWith(prefix)) {
              sprae(el, root[_state] || state, root);
              break;
            }
          }
        }
      }
      // for (const el of m.removedNodes) el[Symbol.dispose]?.()
    }
  });
  mo.observe(root, { childList: true, subtree: true });
  return state
}


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
export const parse = (expr, prepare, _fn) => {
  if (_fn = parse.cache[expr]) return _fn

  let _expr = expr.trim() || 'undefined'
  if (prepare) _expr = prepare(_expr)

  // if, const, let - no return
  if (/^(if|let|const)\b/.test(_expr) || /;(?![^{]*})/.test(_expr)) ;
  else _expr = `return ${_expr}`

  // async expression
  if (/\bawait\s/.test(_expr)) _expr = `return (async()=>{ ${_expr} })()`

  // static time errors
  try {
    _fn = compile(_expr)
    Object.defineProperty(_fn, "name", {value: `∴ ${expr}`})
  } catch (e) { console.error(`∴ ${e}\n\n${prefix + currentDir}="${expr}"`) }

  // run time errors
  return parse.cache[expr] = (state, cb, _out) => {
    try {
      let result = _fn?.(state)
      // if cb is given (to handle asyncs) - call it with result and return function that returns last cb result - needed for effect cleanup
      if (cb) return result?.then ? result.then(v => _out = cb(v)) : _out = cb(result), () => call(_out)
      else return result
    } catch (e) {
      console.error(`∴ ${e}\n\n${prefix + currentDir}="${expr}"`)
    }
  }
}
parse.cache = {};


// apply modifiers to context (from the end due to nature of wrapping ctx.call)
const applyMods = (fn, mods) => {
  while (mods.length) {
    let [name, ...params] = mods.pop().split('-')
    fn = sx(modifier[name]?.(fn, ...params) ?? fn, fn)
  }
  return fn
}

// soft-extend missing props and ignoring signals
const sx = (a, b) => { if (a != b) for (let k in b) (a[k] ??= b[k]); return a }

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

// if value is function - return result of its call
export const call = (v, arg) => typeof v === 'function' ? v(arg) : v

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
  let _planned = 0;
  const throttled = (e) => {
    if (!_planned++) fn(e), schedule((_dirty = _planned > 1) => (
      _planned = 0, _dirty && throttled(e)
    ));
  }
  return throttled;
}

export const debounce = (fn, schedule = queueMicrotask, _count = 0) => (arg, _planned=++_count) => schedule(() => (_planned == _count && fn(arg)))

export * from './store.js';

export default sprae
