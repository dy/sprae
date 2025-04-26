import sprae, { _state, parse, _on, _off } from "../core.js";
import store, { _change, _signals } from "../store.js";
import { effect } from '../signal.js';



// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _prevIf = Symbol("if");

export const dir = {
  // :<any>="expr" or :on="expr" – default property setter
  '*': (el, s, e, parts) => parts[0].startsWith('on') ? on(el, s, e, parts) : value => attr(el, parts[0], value),

  // :="{a,b,c}"
  '': (target) => value => { for (let key in value) attr(target, dashcase(key), value[key]) },

  // :class="[a, b, c]"
  class: (el, _cur, _new) => (
    _cur = new Set,
    (v) => {
      _new = new Set
      if (v) clsx(typeof v === 'function' ? v(el.className) : v).split(' ').map(c => c && _new.add(c))
      for (let c of _cur) if (_new.has(c)) _new.delete(c); else el.classList.remove(c);
      for (let c of _cur = _new) el.classList.add(c)
    }
  ),

  // :text="..."
  text: el => (
    // <template :text="a"/> or previously initialized template
    // FIXME: replace with content maybe?
    el.content && el.replaceWith(el = frag(el).childNodes[0]),
    value => (typeof value === 'function' && (value = value(el.textContent)), el.textContent = value == null ? "" : value)
  ),

  // :style="..."
  style: (el, _static) => (
    _static = el.getAttribute("style"),
    v => {
      if (typeof v === 'function') v = v(el.style)
      if (typeof v === "string") attr(el, "style", _static + '; ' + v);
      else {
        if (_static) attr(el, "style", _static);
        // NOTE: we skip names not starting with a letter - eg. el.style stores properties as { 0: --x }
        for (let k in v) k[0] == '-' ? el.style.setProperty(k, v[k]) : k[0] > 'A' && (el.style[k] = v[k])

      }
    }
  ),

  // :each="v,k in src"
  each: (tpl, state, ev) => {
    // FIXME: we can add fake-keys for plain arrays
    // NOTE: it's cheaper to parse again, rather than  invent
    parse(ev.expr.split(/\bin\b/)[1])

    let [itemVar, idxVar = "$"] = expr.split(/\bin\b/)[0].trim().replace(/\(|\)/g, '').split(/\s*,\s*/);

    // we need :if to be able to replace holder instead of tpl for :if :each case
    let holder = document.createTextNode("");

    // we re-create items any time new items are produced
    let cur, keys, items, prevl = 0

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
            // FIXME: inherited state is cheaper in terms of memory and faster in terms of performance
            // compared to cloning all parent signals and creating a proxy
            // FIXME: besides try to avoid _signals access: we can optimize store then not checking for _signals key
            // scope = store({
            //   [itemVar]: cur[_signals]?.[idx] || cur[idx],
            //   // [idxVar]: keys ? keys[idx] : idx
            // }, state)
            subscope = Object.create(state, {
              [itemVar]: { get: () => cur[idx] },
              [idxVar]: { value: keys ? keys[idx] : idx }
            })

          let el = tpl.content ? frag(tpl) : tpl.cloneNode(true);

          holder.before(el.content || el);
          sprae(el, subscope);

          // signal/holder disposal removes element
          ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose] = () => {
            el[Symbol.dispose]?.(), el.remove()
          };
        }
      }

      prevl = newl
    }

    tpl.replaceWith(holder);
    tpl[_state] = null // mark as fake-spraed, to preserve :-attribs for template

    return value => {
      // obtain new items
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

  // :fx="..."
  fx: _ => _ => _,

  // :ref="..."
  ref: (el, state, expr) => (
    typeof parse(expr)(state) == 'function' ?
      v => v(el) :
      setter(expr)(state, el)
  ),

  // :scope creates variables scope for a subtree
  scope: (el, rootState, expr, _init) => (
    // NOTE: we cannot do :scope="expr" -> :scope :with="expr" because there's no way to prepend attribute in DOM
    sprae(el, store(parse(expr)(rootState), rootState)),
    values => (_init ? sprae(el, values) : _init = true)
  ),

  // :if="a" :else
  if: (el, state) => {
    let holder = document.createTextNode('')

    let nextEl = el.nextElementSibling,
      curEl, ifEl, elseEl;

    el.replaceWith(holder)

    ifEl = el.content ? frag(el) : el
    ifEl[_state] = null // mark el as fake-spraed to hold-on init, since we sprae rest when branch matches

    // FIXME: instead of nextEl / el we should use elseEl / ifEl
    if (nextEl?.hasAttribute(":else")) {
      nextEl.removeAttribute(":else");
      // if nextEl is :else :if - leave it for its own :if handler
      if (!nextEl.hasAttribute(":if")) nextEl.remove(), elseEl = nextEl.content ? frag(nextEl) : nextEl, elseEl[_state] = null
    }
    else nextEl = null

    return (value, newEl = el[_prevIf] ? null : value ? ifEl : elseEl) => {
      if (nextEl) nextEl[_prevIf] = el[_prevIf] || newEl == ifEl
      if (curEl != newEl) {
        // disable effects on child elements when element is not matched
        if (curEl) curEl.remove(), curEl[_off]?.()
        if (curEl = newEl) {
          holder.before(curEl.content || curEl)
          // remove state stub to sprae as new
          curEl[_state] === null ? (delete curEl[_state], sprae(curEl, state))
            // enable effects if branch is matched
            : curEl[_on]()
        }
      }
    };
  },

  // :with directive extends current state with vars
  with: (_, state) => values => console.log(1232345, values) || Object.assign(state, values),

  // :value - 2 way binding like x-model
  value: (el, state, expr) => {
    // bind back to value, but some values can be not bindable, eg. `:value="7"`
    try {
      const set = setter(expr)
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
      parse(expr)(state) ?? handleChange()
    } catch { }

    return (el.type === "text" || el.type === "") ?
      (value) => el.setAttribute("value", (el.value = value == null ? "" : value)) :
      (el.tagName === "TEXTAREA" || el.type === "text" || el.type === "") ?
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
  }
}

// FIXME: make throttle/debounce via direct mod fn, not defer
export const mod = {
  // regular modifiers
  debounce: (fn, limit = 108) => debounce(fn, limit),
  throttle: (fn, limit = 108) => throttle(fn, limit),
  once: (fn, _run) => () => !_run ? fn() : _run = true,
  tick: (fn) => () => queueMicrotask(fn),
  interval: (fn, interval = 1080) => () => setInterval(fn, interval),
  raf: (fn) => () => requestAnimationFrame(function tick() { fn(), requestAnimationFrame(tick) }),
  idle: (fn) => () => requestIdleCallback(fn),
  // FIXME: think about these 2
  // async: (fn) => async () => {await fn()},
  // emit: (fn, el, dir) => () => (fn(), el.dispatchEvent(new CustomEvent(dir))),

  // event modifiers
  // actions
  prevent(ctx) { ctx.prevent = 1; },
  stop(ctx) { ctx.stop = 1; },
  immediate(ctx) { ctx.immediate = 1; },

  // options
  once(ctx) { ctx.once = 1; },
  passive(ctx) { ctx.passive = 1; },
  capture(ctx) { ctx.capture = 1; },

  // target
  window(ctx) { ctx.target = window; },
  document(ctx) { ctx.target = document; },
  parent(ctx) { ctx.target = ctx.target.parentNode; },

  throttle(ctx, limit = 108) { ctx.defer = (fn) => throttle(fn, limit) },
  debounce(ctx, wait = 108) { ctx.defer = (fn) => debounce(fn, wait) },

  // test
  outside: (ctx) => (e, _target) => (
    _target = ctx.target,
    !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight)
  ),
  self: (ctx) => (e) => e.target === ctx.target,
};

// :event
const on = (target, state, expr, parts) => {
  // ona..onb
  let ctx, ctxs = [], mod, params
  for (let part of [, ...parts]) {
    // empty part means next event in chain ona..onb
    if (!part) ctxs.push(ctx = { evt: '', target, test: _ => 1 });
    // first part means event ona.x
    else if (!ctx.evt) ctx.evt = part.slice(2)
    // rest of parts apply modifiers
    else ([mod, ...params] = part.split('-'), ctx.test = sprae.mod[mod]?.(ctx, params) || ctx.test)
  }

  // add listener with the context
  let addListener = (fn, { evt, target, test, defer, stop, prevent, immediate, ...opts }, _cb) => (
    fn = defer?.(fn) ?? fn,
    _cb = safe((e) =>
      test(e) && (stop && (immediate ? e.stopImmediatePropagation() : e.stopPropagation()), prevent && e.preventDefault(), fn(e))
      , expr, 'on'),
    target.addEventListener(evt, _cb, opts),
    () => target.removeEventListener(evt, _cb, opts)
  );

  // single event
  if (ctxs.length == 1)
    return v => addListener(v, ctxs[0])

  // events cycler
  let startFn, nextFn, off, idx = 0
  let nextListener = (fn) => {
    off = addListener((e) => (
      off(), nextFn = fn?.(e), (idx = ++idx % ctxs.length) ? nextListener(nextFn) : (startFn && nextListener(startFn))
    ), ctxs[idx]);
  }


  // we don't need an effect here to rebind listener: we only read state inside of events
  nextListener((event) => {
    startFn = evaluate(state)
    if (typeof startFn === 'function') startFn = startFn(event)

    !off && nextListener(startFn)
  })

  return () => (off?.(), startFn = 0) // nil startFn to autodispose chain
}

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
for (let k in keys) sprae.mod[k] = (_, params) => e => keys[k](e) && params.every(k => keys[k]?.(e) ?? e.key === k)

// create delayed fns
const throttle = (fn, limit, _pause, _planned, _block) => (
  _block = (e) => (
    _pause = 1,
    setTimeout(() => (
      _pause = 0,
      // if event happened during blocked time, it schedules call by the end
      _planned && (_planned = 0, _block(e), fn(e))
    ), limit)
  ),
  (e) => _pause ? _planned = 1 : (_block(e), fn(e))
)

const debounce = (fn, wait, _timeout) => (e) => (
  clearTimeout(_timeout),
  _timeout = setTimeout(() => (
    _timeout = null,
    fn(e)
  ), wait)
)

// create expression setter, reflecting value back to state
const setter = (expr, _set = parse(`${expr}=__`)) => (state, value) => {
  // save value to stash
  state.__ = value, _set(state)
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

// camel to kebab
const dashcase = (str) => str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? '-' : '') + match.toLowerCase());

// set attr
const attr = (el, name, v) => (v == null || v === false) ? el.removeAttribute(name) : el.setAttribute(name, v === true ? "" : v);

// convert any-arg to className string
const clsx = (c, _out = []) => !c ? '' : typeof c === 'string' ? c : (
  Array.isArray(c) ? c.map(clsx) :
    Object.entries(c).reduce((s, [k, v]) => !v ? s : [...s, k], [])
).join(' ')
