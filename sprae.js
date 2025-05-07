// standard sprae entry

import sprae, { _state, parse, _on, _off } from "../core.js";
import store, { _change, _signals } from "../store.js";
import { effect } from '../signal.js';
import { signal, untracked } from "./signal.js";

export default sprae

// multiprop sequences initializer, eg. :a:b..c:d
// micro version has single-prop direct initializer, way simpler
sprae.init = (el, attr, expr, state) => {
  let cur = call, // current step callback
    off // current step disposal

  // FIXME: events don't need effects.
  // FIXME: separate cases: async, event, sequence, single attr

  let steps = attr.split('..').map((step, i, stepNames) => (
      // multiple attributes like :id:for=""
      step.slice(sprae.prefix.length).split(':').reduce((prev, str) => {
        let [name, ...mods] = str.split('.'),
          // event is either :click or :onclick, since on* events never intersect with * attribs
          isEvent = (name.startsWith('on') && (name = name.slice(2), 1)) || el['on' + name],
          evaluate = parse(expr),
          len = stepNames.length,
          update = !isEvent ? sprae.dir[name]?.(el, state, value) ?? (v => attr(el, name, call(v, el.getAttribute(name)))) : // attribute
            len == 1 ? call : // single event
            (e) => (cur = cur?.(e), off(), !(idx = ++idx % len) && (cur = call), off = steps[idx]()), // event cycler
            dispose;

        // simple attr shortcut
        // if (!prev && !isEvent && !mods.length) return () => effect(() => (update(evaluate(state), arg)))

        // special signal authorized to trigger effect: 0 = init; >0 = trigger
        let change = signal(-1), count,
          // effect applier - first time it applies the effect, next times effect is triggered by change signal
          fn = (arg) => { if (!++change.value) dispose = effect(() => { change.value != count ? (update(evaluate(state), arg), count=change.value) : trigger(arg) })  },

          // calling context: we apply dynamic functions from sequence
          ctx = { target: el, call, off:null },

          // whenever dir is triggered, we cancel pending modifiers
          trigger = (e) => (ctx.off?.(), ctx.off = ctx.call(fn, e) )

        // apply modifiers to context
        for (let mod of mods) {
          let [name, ...params] = mod.split('-')
          sprae.mod[name]?.(ctx, ...params)
        }

        // enables adjacent directives as well, like :a:b
        return !isEvent ? (_poff) => (_poff = prev?.(), trigger(), () => (_poff(), call(dispose))) :
          (_poff) => (_poff = prev?.(), ctx.target.addEventListener(name, trigger, ctx), () => (_poff?.(), ctx.target.removeEventListener(name, trigger)))
      }, null)
    ));

  // off can be changed on the go
  return () => (off = steps[0](), () => off())
}

// simple eval (indirect new Function to avoid detector)
sprae.compile = expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`)

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _prevIf = Symbol("if");

// standard directives
sprae.dir = {
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
        // NOTE: we skip names not starting with a letter - eg. el.style stores properties as { 0: --x }
        for (let k in v) k[0] == '-' ? el.style.setProperty(k, v[k]) : k[0] > 'A' && (el.style[k] = v[k])

      }
    }
  ),

  // :fx="..."
  fx: _ => _ => _,

  // :ref="..."
  ref: (el, state, expr) => (
    typeof parse(expr)(state) == 'function' ?
      v => v(el) :
      setter(expr)(state, el)
  ),

  // :scope creates variables scope for a subtree
  // NOTE: we cannot do :scope="expr" -> :scope :with="expr" because there's no way to prepend attribute in DOM
  scope: (el, rootState, _scope) => (
    // prevent subsequent effects
    el[_state] = null,
    // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
    _scope = store({}, rootState),
    // 1 run spraes subtree with values from scope - it can be postponed by modifiers
    values => (Object.assign(_scope, values), el[_state] ?? (delete el[_state], sprae(el, _scope)))
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
  },

  // :each="v,k in src"
  each: (tpl, state, expr) => {
    // FIXME: we can add fake-keys for plain arrays
    // NOTE: it's cheaper to parse again, rather than introduce workarounds: effect is anyways subscribed to full expression
    // FIXME: oversubscription in eg. <x :scope="k=1"><y :each="v,k in list"></y></x> - whenever outer k changes list updates
    parse(expr.split(/\bin\b/)[1])

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
}

// standard modifiers
sprae.mod = {
  // FIXME: add -s, -m, -l classes with values
  debounce: (ctx, wait = 108, _call = ctx.call) => (ctx.call = (fn, e, _id, _out) => (_id = setTimeout(() => (_id = null, _out = _call(fn, e)), wait), () => (clearTimeout(_id), call(_out)))),
  once: (ctx, _done, _out, _call = ctx.call) => (ctx.once = true, ctx.call = (fn, a) => !_done ? (_done = 1, _out = _call(fn, a)) : _out ),
  // FIXME: make throttle
  throttle: (ctx, limit = 108) => throttle(ctx, limit),
  tick: (fn) => (a, _cancel, _out) => (_cancel = false, queueMicrotask(() => !_cancel && (_out = fn(a))), () => (_cancel = true, call(_out))),
  interval: (ctx, interval = 1080, _id, _out) => (a) => (_id = setInterval(() => _out = fn(a), interval), () => (clearInterval(_id), call(_out))),
  raf: (ctx, _out, _id, _tick) => (_tick = a => (_out = fn(a), _id = requestAnimationFrame(_tick)), a => (_tick(a), () => (cancelAnimationFrame(_id), call(_out)))),
  idle: (ctx, _id, _out) => (a) => (_id = requestIdleCallback(() => _out = fn(a), interval), () => (cancelIdleCallback(_id), call(_out))),
  // emit: (fn) => (a) => (fn.target.dispatchEvent(new CustomEvent(fn.name)), fn(a)),
  // FIXME:
  // async: (fn) => (fn.async = true, fn),

  // event modifiers
  // actions
  prevent: (ctx, _call=ctx.call) => ( ctx.call = (fn, e) => (e?.preventDefault(), _call(fn, e))),
  stop: (ctx, _call=ctx.call) => ( ctx.call = (fn, e) => (e?.stopPropagation(), _call(fn, e))),
  immediate: (ctx, _call=ctx.call) => ( ctx.call = (fn, e) => (e?.stopImmediatePropagation(), _call(fn, e))),

  // options
  passive: ctx => (ctx.passive = true),
  capture: ctx => (ctx.capture = true),

  // target
  window: ctx => (ctx.target = window),
  document: ctx => (ctx.target = document),
  parent: ctx => (ctx.target = ctx.target.parentNode),


  // test
  self: (ctx, _out, _call = ctx.call) => ( ctx.call = (fn,e) => (e.target === ctx.target ? (_out = _call(fn, e)) : _out) ),
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
for (let k in keys) sprae.mod[k] = (fn, params) => e => keys[k](e) && params.every(k => keys[k]?.(e) ?? e.key === k)


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
