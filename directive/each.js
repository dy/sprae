import sprae, { _state, effect, _change, _signals, frag, throttle } from "../core.js";

const each = (tpl, state, expr) => {
  let [itemVar, idxVar = "$"] = expr.split(/\bin\b/)[0].trim().replace(/\(|\)/g, '').split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  let holder = document.createTextNode("");

  // we re-create items any time new items are produced
  let cur, keys, items, prevl = 0

  // FIXME: pass items to update instead of global
  let update = throttle(() => {
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
          // subscope = store({
          //   // NOTE: since we simulate signal, we have to make sure it's actual signal, not fake one
          //   // FIXME: try to avoid this, we also have issue with wrongly calling dispose in store on delete
          //   [itemVar]: cur[_signals]?.[idx]?.peek ? cur[_signals]?.[idx] : cur[idx],
          //   [idxVar]: keys ? keys[idx] : idx
          // }, state)
        subscope = Object.create(state, {
          [itemVar]: { get: () => cur[idx] },
          [idxVar]: { value: keys ? keys[idx] : idx }
        })

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
  })

  tpl.replaceWith(holder);
  tpl[_state] = null // mark as fake-spraed, to preserve :-attribs for template

  return value => {
    // resolve new items
    keys = null
    if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1)
    else if (value?.constructor === Object) keys = Object.keys(value), items = Object.values(value)
    else items = value || []

    // whenever list changes, we rebind internal change effect
    return effect(() => {
      // subscribe to items change (.length) - we do it every time (not just in update) since preact unsubscribes unused signals
      items[_change]?.value

      // make first render immediately, debounce subsequent renders
      update()
    })
  }
}

// :each directive skips v, k
each.parse = (str) => str.split(/\bin\b/)[1].trim()

export default each
