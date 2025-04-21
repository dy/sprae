import sprae, { _state, frag } from "../core.js";
import store, { _change, memo } from "../store.js";
import { effect } from '../signal.js';


export default (tpl, state, expr) => {
  let [itemVar, idxVar = "$"] = expr.split(/\b(?:in|of)\b/)[0].trim().replace(/\(|\)/g,'').split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  let holder = document.createTextNode("");

  // we re-create items any time new items are produced
  let cur, keys, items, prevl = 0

  let update = () => {
    let i = 0, newItems = items, newl = newItems.length

    // plain array update, not store (signal with array) - updates full list
    if (cur && !cur[_change]) {
      for (let s of memo.get(cur) || []) s[Symbol.dispose]()
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
            [itemVar]: {get: () => cur[idx]},
            [idxVar]: {value: keys ? keys[idx] : idx}
          })

        let el = tpl.content ? frag(tpl) : tpl.cloneNode(true);

        holder.before(el.content || el);
        sprae(el, subscope);

        // signal/holder disposal removes element
        ((memo.get(cur) || (memo.set(cur,[]), memo.get(cur)))[i] ||= {})[Symbol.dispose] = () => {
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
}
