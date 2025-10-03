import store, { _change, _signals } from "./store.js";

export const _dispose = (Symbol.dispose ||= Symbol("dispose")),
  _state = Symbol("state"),
  _on = Symbol('on'),
  _off = Symbol('off')


export let prefix = ':', signal, effect, computed, batch = (fn) => fn(), untracked = batch;


/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object} [state] - Initial state values to populate the element's reactive state.
 * @returns {Object} The reactive state object associated with the element.
 */
const sprae = (el = document.body, state) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], state)

  console.group('sprae', el)

  // take over existing state instead of creating a clone
  state = store(state || {})

  let fx = [], offs = [], fn,
    // FIXME: on generally needs to account for events, although we call it only in :if
    on = () => (!offs && (offs = fx.map(fn => fn()))),
    off = () => ( offs?.map(off => off()), offs = null)
  // let prevOn = el[_on], prevOff = el[_off]

  // on/off all effects
  // FIXME: we're possibly supposed to call prevOn/prevOff
  // imagine <x :onx="..." :if="..."/> - when :if is false, it disables itself but ignores :onx
  el[_on] = on // () => (prevOn?.(), on())
  el[_off] = off // () => (prevOff?.(), off())

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  const initElement = (el, attrs = el.attributes) => {
    // we iterate live collection (subsprae can init args)
    if (attrs) for (let i = 0; i < attrs.length;) {
      let { name, value } = attrs[i]

      // we suppose
      if (name.startsWith(prefix)) {
        el.removeAttribute(name)

        // directive initializer can be redefined
        console.log('init attr', name)
        fx.push(fn = initDirective(el, name, value, state))
        offs.push(fn())

        // stop after subsprae like :each, :if, :scope etc.
        if (_state in el) return
      } else i++
    }

    // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
    // console.group('init', el, el.childNodes)
    // for (let i = 0, child; i < (console.log(el.childNodes.length, i),el.childNodes.length); i++) child =  el.childNodes[i], console.log('run', i, child.outerHTML), child.nodeType == 1 && init(child)
    // FIXME: don't do spread here
    for (let child of [...el.childNodes]) child.nodeType == 1 && initElement(child)
    // console.groupEnd()
  };

  initElement(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  // FIXME: can check for null instead?
  if (!(_state in el)) el[_state] = state

  console.log('inited', el)
  console.groupEnd()

  return state;
}


/**
 * Initializes directive (defined by sprae build), returns "on" function that enables it
 * Multiprop sequences initializer, eg. :a:b..c:d
 * @type {(el: HTMLElement, name:string, value:string, state:Object) => Function}
 * */
const initDirective = (el, attrName, expr, state) => {
  let cur, // current step callback
    off // current step disposal

  // FIXME: events don't need effects.
  // FIXME: separate cases: async, event, sequence, single attr

  let steps = attrName.slice(prefix.length).split('..').map((step, i, { length }) => (
    // multiple attributes like :id:for=""
    step.split(prefix).reduce((prev, str) => {
      let [name, ...mods] = str.split('.'),
        // event is either :click or :onclick, since on* events never intersect with * attribs
        isEvent = (name.startsWith('on') && (name = name.slice(2), true)) || el['on' + name],
        evaluate = parse(name, expr, dir[name]?.clean)

      // events have no effects and can be sequenced
      if (isEvent) {
        let first = e => (call(evaluate(state), e)),
          fn = applyMods(
            Object.assign(
              // single event vs chain
              length == 1 ? first :
                e => (cur = (!i ? first : cur)(e), off(), off = steps[(i + 1) % length]()),
              { target: el, type: name }
            ),
            mods);

        return (_poff) => (_poff = prev?.(), fn.target.addEventListener(name, fn, fn), () => (_poff?.(), fn.target.removeEventListener(name, fn)))
      }

      // props have no sequences and can be sync
      let update = (dir[name] || dir['*'])(el, state, expr, name)

      // shortcut
      // if (!mods.length && !prev) return () => update && effect(() => (update(evaluate(state))))

      let dispose,
        change = signal(-1), // signal authorized to trigger effect: 0 = init; >0 = trigger
        count = -1, // called effect count

        // effect applier - first time it applies the effect, next times effect is triggered by change signal
        // FIXME: init via dispose, don't reset count
        fn = applyMods(() => {
          if (++change.value) return // all calls except for the first one are handled by effect

          dispose = effect(() => update && (
            // FIXME: possibly we can batch here
            change.value == count ? queueMicrotask(fn) : // plans eval call - separate tick makes sure planner effect is finished before real eval call
            (count = change.value, update(evaluate(state))) // if changed more than effect called - call it
          ));
        }, mods)

      return (_poff) => (
        _poff = prev?.(),
        console.log('ON', name),
        fn(),
        ({
          [name]: () => (
          console.log('OFF', name, el), _poff?.(), dispose(), change.value = -1, count = dispose = null
          )})[name]
        )
    }, null)
  ));

  // off can be changed on the go
  return () => (off = steps[0]())
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
const parse = (dir, expr, _clean = trim, _fn) => {
  // expr.split(/\bin\b/)[1]
  if (_fn = cache[expr = _clean(expr)]) return _fn

  // static time errors
  try { _fn = compile(expr) } catch (e) { console.error(`∴ ${e}\n\n${prefix + dir}="${expr}"`) }

  // run time errors
  return cache[expr] = (s) => { try { return _fn?.(s) } catch (e) { console.error(`∴ ${e}\n\n${prefix + dir}="${expr}"`) } }
}
export const cache = {};
export const trim = e => e.trim()

export const dir = {}

// apply modifiers to context (from the end due to nature of wrapping ctx.call)
const applyMods = (fn, mods) => {
  while (mods.length) {
    let [name, ...params] = mods.pop().split('-')
    fn = sx(mod[name]?.(fn, ...params) ?? fn, fn)
  }
  return fn
}

// soft-extend missing props and ignoring signals
const sx = (a, b) => { if (a != b) for (let k in b) (a[k] ??= b[k]); return a }

// standard modifiers
export const mod = {
  // FIXME: add -s, -m, -l classes with values
  debounce: (fn, wait = 108, _t) => e => (clearTimeout(_t), _t = setTimeout(() => (fn(e)), wait)),
  once: (fn, _done) => Object.assign((e) => !_done && (_done = 1, fn(e)), { once: true }),

  throttle: (fn, limit = 108, _pause, _planned, _t, _block) => (
    _block = (e) => (
      _pause = 1,
      _t = setTimeout(() => (
        _pause = 0,
        // if event happened during blocked time, it schedules call by the end
        _planned && (_planned = 0, _block(e), fn(e))
      ), limit)
    ),
    e => _pause ? _planned = 1 : (_block(e), fn(e))
  ),

  // make batched
  tick: (fn, _planned) => (e) => !_planned && (_planned = 1, queueMicrotask(() => (fn(e), _planned = 0))),

  // FIXME
  interval: (ctx, interval = 1080, _id, _cancel) => (a) => (_id = setInterval(() => _cancel = fn(a), interval), () => (clearInterval(_id), call(_cancel))),
  raf: (ctx, _cancel, _id, _tick) => (_tick = a => (_cancel = fn(a), _id = requestAnimationFrame(_tick)), a => (_tick(a), () => (cancelAnimationFrame(_id), call(_cancel)))),
  idle: (ctx, _id, _cancel) => (a) => (_id = requestIdleCallback(() => _cancel = fn(a), interval), () => (cancelIdleCallback(_id), call(_cancel))),

  emit: (fn) => (e) => e ? fn(e) : (fn.target.dispatchEvent(e = new CustomEvent(fn.type, { bubbles: true, cancelable: true })), !e.defaultPrevented && fn()),
  // FIXME:
  // async: (fn) => (fn.async = true, fn),

  // event modifiers
  // actions
  prevent: (fn) => (e) => (e?.preventDefault(), fn(e)),
  stop: (fn) => (e) => (e?.stopPropagation(), fn(e)),
  immediate: (fn) => (e) => (e?.stopImmediatePropagation(), fn(e)),

  // options
  passive: fn => (fn.passive = true, fn),
  capture: fn => (fn.capture = true, fn),

  // target
  window: fn => (fn.target = window, fn),
  document: fn => (fn.target = document, fn),
  parent: fn => (fn.target = fn.target.parentNode, fn),

  // test
  self: (fn) => (e) => (e.target === fn.target && fn(e)),
  // FIXME
  outside: (fn) => (e, _target) => (
    _target = fn.target,
    !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight)
  ),

  // FIXME:
  //screen: fn => ()
};

// key testers
const keys = {
  ctrl: e => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: e => e.shiftKey || e.key === "Shift",
  alt: e => e.altKey || e.key === "Alt",
  meta: e => e.metaKey || e.key === "Meta" || e.key === "Command",
  arrow: e => e.key.startsWith("Arrow"),
  enter: e => e.key === "Enter",
  esc: e => e.key.startsWith("Esc"),
  tab: e => e.key === "Tab",
  space: e => e.key === " " || e.key === "Space" || e.key === " ",
  delete: e => e.key === "Delete" || e.key === "Backspace",
  digit: e => /^\d$/.test(e.key),
  letter: e => /^\p{L}$/gu.test(e.key),
  char: e => /^\S$/.test(e.key),
};

// augment modifiers with key testers
for (let k in keys) mod[k] = (fn, ...params) => (e) => keys[k](e) && params.every(k => keys[k]?.(e) ?? e.key === k) && fn(e)

// create expression setter, reflecting value back to state
export const setter = (dir, expr, _set = parse(dir, `${expr}=__`)) => (target, value) => {
  // save value to stash
  target.__ = value; _set(target), delete target.__
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

// throttle function to once per tick
export const oncePerTick = (fn, _planned = 0) => {
  const tickCall = () => {
    if (!_planned++) fn(), queueMicrotask((_dirty = _planned > 1) => (
      _planned = 0, _dirty && tickCall()
    ));
  }
  return tickCall;
}

export * from './store.js';

export default sprae
