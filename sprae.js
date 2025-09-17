import store, { _change, _signals } from "./store.js";
import { batch, computed, effect, signal, untracked, use } from './signal.js';

// polyfill
const _dispose = (Symbol.dispose ||= Symbol("dispose"));

const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')

let prefix = ':'

/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object} [values] - Initial values to populate the element's reactive state.
 * @returns {Object} The reactive state object associated with the element.
 */
const sprae = (el = document.body, values) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], values)

  console.group('sprae')

  // take over existing state instead of creating a clone
  let state = store(values || {}),
    fx = [], offs = [], fn,
    _offd = false,
    // FIXME: on generally needs to account for events, although we call it only in :if
    on = () => (!offs && (offs = fx.map(fn => fn()))),
    off = () => (offs?.map(off => off()), offs = null)
    // prevOn = el[_on], prevOff = el[_off]

  // on/off all effects
  // FIXME: we're supposed to call prevOn/prevOff, but I can't find a test case. Some combination of :if/:scope/:each/:ref
  el[_on] = on// () => (prevOn?.(), on())
  el[_off] = off// () => (prevOn?.(), on())
  // FIXME: why it doesn't work?
  // :else :if case. :else may have children to init which is called after :if, so we plan offing instead of immediate
  // el[_off] = () => (!_offd && queueMicrotask(() => (off(), _offd = false)), _offd=true)

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  let initElement = (el, attrs = el.attributes) => {
    // we iterate live collection (subsprae can init args)
    if (attrs) for (let i = 0; i < attrs.length;) {
      let { name, value } = attrs[i]

      // we suppose
      if (name.startsWith(prefix)) {
        el.removeAttribute(name)

        // directive initializer can be redefined
        console.log('init attr',name)
        fx.push(fn = initDirective(el, name, value, state)), offs.push(fn())

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
      console.log("INIT", el, name)

      // props have no sequences and can be sync
      let update = (dir[name] || dir['*'])(el, state, expr, name)

      // shortcut
      // if (!mods.length && !prev) return () => update && effect(() => (update(evaluate(state))))

      let dispose,

        // signal authorized to trigger effect: 0 = init; >0 = trigger
        change = signal(-1), count,

        // effect applier - first time it applies the effect, next times effect is triggered by change signal
        // FIXME: init via dispose, don't reset count
        fn = applyMods(() => {
          // console.log('CALL', el, name, change.peek())
          if (!++change.value) dispose = effect(() => update &&
            (
              change.value != count ?
                (count = change.value, update(evaluate(state))) :
                (fn())
            )
          )
        }, mods)

      return (_poff) => (
        _poff = prev?.(),
        console.log('ON', name), fn(),
        () => (
          console.log('OFF', name), _poff?.(), dispose(), change.value = -1, count = dispose = null
        ))
    }, null)
  ));

  // off can be changed on the go
  return () => (off = steps[0]())
}

/**
 * Compiles an expression into an evaluator function.
 * (indirect new Function to avoid detector)
 * @type {(dir:string, expr: string, clean?: string => string) => Function}
 */
let compile = expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`)


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
const cache = {};
const trim = e => e.trim()


// apply modifiers to context (from the end due to nature of wrapping ctx.call)
const applyMods = (fn, mods) => {
  while (mods.length) {
    let [name, ...params] = mods.pop().split('-')
    fn = sx(mod[name]?.(fn, ...params) ?? fn, fn)
  }
  return fn
}

// soft-extend missing props
const sx = (a, b) => { if (a != b) for (let k in b) a[k] ??= b[k]; return a }


// standard directives
const dir = {
  // :x="x"
  '*': (el, st, ex, name) => v => attr(el, name, call(v, el.getAttribute(name))),

  // :="{a,b,c}"
  '': (target) => value => { for (let key in value) attr(target, dashcase(key), value[key]) },

  // :class="[a, b, c]"
  class: (el, _cur, _new) => (
    _cur = new Set,
    (v) => {
      _new = new Set
      if (v) clsx(call(v, el.className)).split(' ').map(c => c && _new.add(c))
      for (let c of _cur) if (_new.has(c)) _new.delete(c); else el.classList.remove(c);
      for (let c of _cur = _new) el.classList.add(c)
    }
  ),

  // :text="..."
  text: el => (
    // <template :text="a"/> or previously initialized template
    // FIXME: replace with content maybe?
    el.content && el.replaceWith(el = frag(el).childNodes[0]),
    v => (v = call(v, el.textContent), el.textContent = v == null ? "" : v)
  ),

  // :style="..."
  style: (el, _static) => (
    _static = el.getAttribute("style"),
    v => {
      v = call(v, el.style)
      if (typeof v === "string") attr(el, "style", _static + '; ' + v);
      else {
        if (_static) attr(el, "style", _static);
        // NOTE: we skip names not starting with a letter - eg. el.style stores properties as { 0: --x } or JSDOM has _pfx
        for (let k in v) k[0] == '-' ? el.style.setProperty(k, v[k]) : k[0] > 'A' && (el.style[k] = v[k])
      }
    }
  ),

  // :fx="..."
  fx: () => call,

  // :value - 2 way binding like x-model
  value: (el, state, expr, name) => {
    // bind back to value, but some values can be not bindable, eg. `:value="7"`
    try {
      const set = setter(name, expr)
      const handleChange = el.type === 'checkbox' ? () => set(state, el.checked) :
        el.type === 'select-multiple' ? () => set(state, [...el.selectedOptions].map(o => o.value)) :
          () => set(state, el.selectedIndex < 0 ? null : el.value)

      el.oninput = el.onchange = handleChange; // hope user doesn't redefine these manually via `.oninput = somethingElse` - it saves 5 loc vs addEventListener

      if (el.type?.startsWith('select')) {
        // select element also must observe any added/removed options or changed values (outside of sprae)
        new MutationObserver(handleChange).observe(el, { childList: true, subtree: true, attributes: true });

        // select options must be initialized before calling an update
        sprae(el, state)
      }

      // initial state value
      cache[trim(expr)](state) ?? handleChange()
    } catch { }

    return (el.type === "text" || el.type === "") ?
      (value) => el.setAttribute("value", (el.value = value == null ? "" : value)) :
      (el.id === "TEXTAREA" || el.type === "text" || el.type === "") ?
        (value, from, to) => (
          // we retain selection in input
          (from = el.selectionStart),
          (to = el.selectionEnd),
          el.setAttribute("value", (el.value = value == null ? "" : value)),
          from && el.setSelectionRange(from, to)
        ) :
        (el.type === "checkbox") ?
          (value) => (el.checked = value, attr(el, "checked", value)) :
          (el.type === "select-one") ?
            (value) => {
              for (let o of el.options)
                o.value == value ? o.setAttribute("selected", '') : o.removeAttribute("selected");
              el.value = value;
            } :
            (el.type === 'select-multiple') ? (value) => {
              for (let o of el.options) o.removeAttribute('selected')
              for (let v of value) el.querySelector(`[value="${v}"]`).setAttribute('selected', '')
            } :
              (value) => (el.value = value);
  },

  // :ref="..."
  ref: (el, state, expr, name, _prev, _set) => (
    typeof cache[trim(expr)](state) == 'function' ?
      v => v(el) :
      // NOTE: we have to set element statically (outside of effect) to avoid parasitic sub - multiple els with same :ref can cause recursion (eg. :each :ref="x")
      setter(name, expr)(state, el)
  ),

  // :scope creates variables scope for a subtree
  // NOTE: we cannot do :scope="expr" -> :scope :with="expr" because there's no way to prepend attribute in DOM
  scope: (el, rootState, _scope) => (
    // prevent subsequent effects
    el[_state] = null,
    // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
    _scope = store({}, rootState),
    // 1 run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
    values => (Object.assign(_scope, values), el[_state] ?? (delete el[_state], untracked(() => sprae(el, _scope))))
  ),

  // :if="a"
  if: (el, state, _holder, _el, _prev, _off) => (

    // new element :if
    !el._holder ?
      (
        el.replaceWith(_holder = document.createTextNode('')),
        _el = el.content ? frag(el) : el,
        el._holder = _holder,
        _el[_state] ??= null, // mark el as fake-spraed to delay init, since we sprae rest when branch matches
        console.log('init if'),
        _holder._el = el,
        _holder._match = signal(1), // indicates if current clause or any prev clause matches
        (_holder.nextElementSibling || {})._prev = _holder, // propagate linked condition

        value => (
          console.group('if', el),

          (_holder._match.value = value) ? (
            console.log('if yes', _el),
            _holder.before(_el.content || _el),
            _el[_state] === null ? (delete _el[_state], sprae(_el, state)) : _el[_on]?.()
          ) : (
            console.log('if no', _el),
            _el.remove(), _el[_off]?.()
          ),
          console.groupEnd()
        )
      ) :

      // :else :if
      (
        _prev = el._prev,
        _holder = el._holder,
        _el = _holder._el,
      //   // _holder._match ??= signal(1), // _match is supposed to be created by :else
        _holder._match._if = true, // take over control of :else :if branch, make :else handler bypass
        console.log('init elif'),

      //   // :else may have children to init which is called after :if
      //   // or preact can schedule :else after :if, so we ensure order of call by next tick
        value => {
          _holder._match.value = value || _prev._match.value;

          console.group('elif')

          !_prev._match.value && value ?
            // queueMicrotask(() =>
            (
              console.log('elif yes', el),
              _holder.before(_el.content || _el),
              _el[_on]?.()
              // )
            )
            :
            // queueMicrotask(() =>
            (
              console.log('elif no', el),
              _el.remove(), _el[_off]?.(_el)
              // )
            )

          console.groupEnd()

        }
      )
  ),

  // NOTE: we can reach :else counterpart whereas prev :else :if is on hold
  else: (el, state, _holder, _el, _if, _prev) => (
    _prev = el._prev,
    console.log('init else'),
    el.replaceWith(_holder = el._holder = document.createTextNode('')),
    _el = el.content ? frag(el) : el,
    _el[_state] ??= null, // mark el as fake-spraed to delay init, since we sprae rest when branch matches
    _holder._el = _el,
    _holder._match = signal(1), // pre-create _match for :else :if, since the :if can be lazy-paused and :else after it relies on _prev (also it should be `true` to indicate that last :else is not active)
    (_holder.nextElementSibling || {})._prev = _holder, // propagate linked condition

    () => {
      if (_holder._match._if) return // bypass :else :if handler
      console.group('else', el),
      !_prev?._match.value ? (
        console.log('else yes'),
        _holder.before(_el.content || _el),
        _el[_state] === null ? (delete _el[_state], sprae(_el, state)) : (_el[_on]?.())
      ) : (
        console.log('else no'),
        _el.remove(), _el[_off]?.()
      ),
      console.groupEnd()
    }
  ),


  // :each="v,k in src"
  each: (tpl, state, expr) => {
    let [itemVar, idxVar = "$"] = expr.split(/\bin\b/)[0].trim().replace(/\(|\)/g, '').split(/\s*,\s*/);

    // we need :if to be able to replace holder instead of tpl for :if :each case
    let holder = document.createTextNode("");

    // we re-create items any time new items are produced
    let cur, keys, items, prevl = 0

    // FIXME: pass items to update instead of global
    let update = () => {
      let i = 0, newItems = items, newl = newItems.length

      // plain array update, not store (signal with array) - updates full list
      if (cur && !cur[_change]) {
        for (let s of cur[_signals] || []) s[Symbol.dispose]()
        cur = null, prevl = 0
      }

      // delete
      if (newl < prevl) cur.length = newl

      // update, append, init
      else {
        // init
        if (!cur) cur = newItems
        // update
        else while (i < prevl) cur[i] = newItems[i++]

        // append
        for (; i < newl; i++) {
          cur[i] = newItems[i]

          let idx = i,
            // FIXME: inherited state is cheaper in terms of memory and faster in terms of performance, compared to creating a proxy
            subscope = store({
              // NOTE: since we simulate signal, we have to make sure it's actual signal, not fake one
              // FIXME: try to avoid this, we also have issue with wrongly calling dispose in store on delete
              [itemVar]: cur[_signals]?.[idx]?.peek ? cur[_signals]?.[idx] : cur[idx],
              [idxVar]: keys ? keys[idx] : idx
            }, state)
          // subscope = Object.create(state, {
          //   [itemVar]: { get: () => cur[idx] },
          //   [idxVar]: { value: keys ? keys[idx] : idx }
          // })

          let el = tpl.content ? frag(tpl) : tpl.cloneNode(true);

          holder.before(el.content || el);

          sprae(el, subscope);

          // signal/holder disposal removes element
          let _prev = ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose]
          cur[_signals][i][Symbol.dispose] = () => {
            _prev?.(), el[Symbol.dispose]?.(), el.remove()
          };
        }
      }

      prevl = newl
    }

    tpl.replaceWith(holder);
    tpl[_state] = null // mark as fake-spraed, to preserve :-attribs for template

    return value => {
      // resolve new items
      keys = null
      if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1)
      else if (value?.constructor === Object) keys = Object.keys(value), items = Object.values(value)
      else items = value || []

      // whenever list changes, we rebind internal change effect
      let planned = 0
      return effect(() => {
        // subscribe to items change (.length) - we do it every time (not just in update) since preact unsubscribes unused signals
        items[_change]?.value

        // make first render immediately, debounce subsequent renders
        if (!planned++) update(), queueMicrotask(() => (planned > 1 && update(), planned = 0));
      })
    }
  },
}

// :each directive skips v, k
dir.each.clean = (str) => str.split(/\bin\b/)[1].trim()

// standard modifiers
const mod = {
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
const setter = (dir, expr, _set = parse(dir, `${expr}=__`)) => (target, value) => {
  // save value to stash
  target.__ = value; _set(target), delete target.__
}

// instantiated <template> fragment holder, like persisting fragment but with minimal API surface
const frag = (tpl) => {
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
const call = (v, arg) => typeof v === 'function' ? v(arg) : v

// camel to kebab
const dashcase = (str) => str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? '-' : '') + match.toLowerCase());

// set attr
const attr = (el, name, v) => (v == null || v === false) ? el.removeAttribute(name) : el.setAttribute(name, v === true ? "" : v);

// convert any-arg to className string
const clsx = (c, _out = []) => !c ? '' : typeof c === 'string' ? c : (
  Array.isArray(c) ? c.map(clsx) :
    Object.entries(c).reduce((s, [k, v]) => !v ? s : [...s, k], [])
).join(' ')



/**
 * Configure sprae
 */
sprae.use = (s) => (
  s.compile && (compile = s.compile),
  s.prefix && (prefix = s.prefix),
  use(s)
)


export default sprae
export { sprae, store, signal, effect, computed, batch, untracked }
