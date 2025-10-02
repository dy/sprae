import store, { _change, _signals } from "./store.js";
import { batch, computed, effect, signal, untracked } from './signal.js';
import sprae, { use, dir, mod, _off, _state, _on, _dispose, call, attr, cache, trim } from './core.js';
import _if from "./directive/if.js";
import _else from "./directive/else.js";


// standard directives
Object.assign(dir, {
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
  fx: () => v => (call(v)),

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
      v => (v(el)) :
      // NOTE: we have to set element statically (outside of effect) to avoid parasitic sub - multiple els with same :ref can cause recursion (eg. :each :ref="x")
      (setter(name, expr)(state, el),console.log(1234,name,expr,state, state[expr]))
  ),

  // :scope creates variables scope for a subtree
  // NOTE: we cannot do :scope="expr" -> :scope :with="expr" because there's no way to prepend attribute in DOM
  scope: (el, rootState, _scope) => (
    // prevent subsequent effects
    el[_state] = null,
    // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
    _scope = store({}, rootState),
    // 1st run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
    // 2nd+ runs update _scope
    values => (Object.assign(_scope, call(values, _scope)), el[_state] ?? (delete el[_state], untracked(() => sprae(el, _scope)))  )
  ),

  if: _if,
  else: _else,

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
})

// :each directive skips v, k
dir.each.clean = (str) => str.split(/\bin\b/)[1].trim()

// configure defaults
use({
  // indirect new Function to avoid detector
  compile: expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`),
  signal, effect, computed, batch, untracked
})


export default sprae
export { sprae, store, signal, effect, computed, batch, untracked }
