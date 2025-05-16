// standard sprae entry

import sprae, { _state, _on, _off } from "./core.js";
import store, { _change, _signals } from "./store.js";
import signals, { batch, computed, effect } from './signal.js';
import { signal, untracked } from "./signal.js";

export default sprae

// use default signals
sprae.use(signals)


// multiprop sequences initializer, eg. :a:b..c:d
// micro version has single-prop direct initializer, way simpler
sprae.init = (el, attrName, expr, state) => {
  let cur, // current step callback
    off // current step disposal

  // FIXME: events don't need effects.
  // FIXME: separate cases: async, event, sequence, single attr

  let steps = attrName.slice(sprae.prefix.length).split('..').map((step, i, { length }) => (
    // multiple attributes like :id:for=""
    step.split(':').reduce((prev, str) => {
      let [name, ...mods] = str.split('.'),
        // event is either :click or :onclick, since on* events never intersect with * attribs
        isEvent = (name.startsWith('on') && (name = name.slice(2), true)) || el['on' + name],
        evaluate = compile(name, expr, sprae.dir[name]?.clean)

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
      let update = (sprae.dir[name] || sprae.dir['*'])(el, state, expr, name)

      // shortcut
      // if (!mods.length && !prev) return () => update && effect(() => update(evaluate(state)))

      let dispose,

        // signal authorized to trigger effect: 0 = init; >0 = trigger
        change = signal(-1), count,

        // effect applier - first time it applies the effect, next times effect is triggered by change signal
        // we call fn next tick to avoid wrong teardown callback - anyways modifiers
        // FIXME: init via dispose, don't reset count
        fn = applyMods(() => {
          if (!++change.value) dispose = effect(() => update && (change.value != count ? (count = change.value, update(evaluate(state))) : (queueMicrotask(fn))))
        }, mods)

      return (_poff) => (_poff = prev?.(), fn(), () => (_poff?.(), dispose(), change.value = -1, count = dispose = null))
    }, null)
  ));

  // off can be changed on the go
  return () => (off = steps[0]())
}

/**
 * Compiles an expression into an evaluator function.
 * (indirect new Function to avoid detector)
 * @type {(expr: string) => Function}
 */
sprae.compile = expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`)


/**
 * Parses an expression into an evaluator function, caching the result for reuse.
 *
 * @param {string} expr The expression to parse and compile into a function.
 * @returns {Function} The compiled evaluator function for the expression.
 */
const compile = (dir, expr, _clean = trim, _fn) => {
  // expr.split(/\bin\b/)[1]
  if (_fn = cache[expr = _clean(expr)]) return _fn

  // static time errors
  try { _fn = sprae.compile(expr) } catch (e) { console.error(`∴ ${e}\n\n${sprae.prefix + dir}="${expr}"`) }

  // run time errors
  return cache[expr] = (s) => { try { return _fn?.(s) } catch (e) { console.error(`∴ ${e}\n\n${sprae.prefix + dir}="${expr}"`) } }
}
const cache = {};
const trim = e => e.trim()


// apply modifiers to context (from the end due to nature of wrapping ctx.call)
const applyMods = (fn, mods) => {
  while (mods.length) {
    let [name, ...params] = mods.pop().split('-')
    fn = sx(sprae.mod[name]?.(fn, ...params) ?? fn, fn)
  }
  return fn
}

// soft-extend missing props
const sx = (a, b) => { if (a != b) for (let k in b) a[k] ??= b[k]; return a }


// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _if = Symbol("if"), _else = Symbol("else"), _prev = Symbol("pref");

// standard directives
sprae.dir = {
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

  // :if="a" :else
  if: (el, state) => {
    let holder = document.createTextNode('')

    let nextEl = el.nextElementSibling,
      curEl, ifEl, elseEl;

    el.replaceWith(holder)

    ifEl = el.content ? frag(el) : el
    ifEl[_state] = null // mark el as fake-spraed to hold-on init, since we sprae rest when branch matches

    // FIXME: instead of nextEl / el we should use elseEl / ifEl
    if (nextEl?.hasAttribute(sprae.prefix + "else")) {
      nextEl.removeAttribute(sprae.prefix + "else");
      // if nextEl is :else :if - leave it for its own :if handler
      if (!nextEl.hasAttribute(sprae.prefix + "if")) nextEl.remove(), elseEl = nextEl.content ? frag(nextEl) : nextEl, elseEl[_state] = null
    }
    else nextEl = null

    return (value, newEl = el[_if] ? null : value ? ifEl : elseEl) => {
      if (nextEl) nextEl[_if] = el[_if] || newEl == ifEl
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

  /*
  // :else? :if="a"
  // separate directives are more efficient than batch or couple propagation
  if: (el, state, _holder, _el) => (
    el[_else] ??= signal(1), // :if -> :else :if
    el[_if] = signal(1),
    (el.nextElementSibling||{})[_prev] = el, // pass itself to :else

    el.replaceWith(_holder = document.createTextNode('')),
    el[_state] = null, // mark el as fake-spraed to delay init, since we sprae rest when branch matches
    _el = el.content ? frag(el) : el,

    value => el[_if].value = el[_else].value && value ? (
      console.log('if on', el.tagName),
        _holder.before(_el.content || _el),
        el[_state] === null ? (delete el[_state], sprae(el, state)) : el[_on](),
        1
      ) : (
      console.log('if off', el.tagName),
        el.remove(), el[_off]?.(), 0
      )

  ),

  else: (el, state, expr, _update) => el[_prev] && (
    el[_else] = computed(() => !el[_prev][_if].value),
    console.log('else', el.tagName, el[_prev][_if].value),
    // :else -> :else :if
    _update = sprae.dir.if(el, state),
    () => (console.group('else'), _update(true), console.groupEnd())
  ),
  */

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
sprae.dir.each.clean = (str) => str.split(/\bin\b/)[1].trim()

// standard modifiers
sprae.mod = {
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
for (let k in keys) sprae.mod[k] = (fn, ...params) => (e) => keys[k](e) && params.every(k => keys[k]?.(e) ?? e.key === k) && fn(e)

// create expression setter, reflecting value back to state
const setter = (dir, expr, _set = compile(dir, `${expr}=__`)) => (target, value) => {
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
