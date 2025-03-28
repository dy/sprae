import sprae, { _state, dir, frag, parse } from "../core.js";
import store, { _change, _signals } from "../store.js";
import { untracked, effect } from '../signal.js';


dir('each', (tpl, state, expr) => {
    const [itemVar, idxVar = "$"] = expr.split(/\s+in\s+/)[0].split(/\s*,\s*/);

    // we need :if to be able to replace holder instead of tpl for :if :each case
    const holder = (document.createTextNode(""));
    tpl.replaceWith(holder);
    tpl[_state] = null // mark as fake-spraed, to preserve :-attribs for template

    // we re-create items any time new items are produced
    let cur, keys, items, prevl = 0

    const update = () => {
      // NOTE: untracked avoids rerendering full list whenever internal items or props change
      untracked(() => {
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
              scope = store({
                [itemVar]: cur[_signals]?.[idx] || cur[idx],
                [idxVar]: keys ? keys[idx] : idx
              }, state),
              el = tpl.content ? frag(tpl) : tpl.cloneNode(true);

            holder.before(el.content || el);
            sprae(el, scope);

            // signal/holder disposal removes element
            ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose] = () => {
              el[Symbol.dispose]?.(), el.remove()
            };
          }
        }

        prevl = newl
      })
    }

    // separate computed effect reduces number of needed updates for the effect
    // NOTE: this code is run only when list value changes (expr), not when list mutates or internal children rerun
    return value => {
      keys = null
      if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1)
      else if (value?.constructor === Object) keys = Object.keys(value), items = Object.values(value)
      else items = value || []

      // whenever list changes, we rebind internal change effect
      let planned = 0
      return effect(() => {
        // subscribe to items change (.length) - we do it every time (not just on init) since preact unsubscribes unused signals
        items[_change]?.value

        // make first render immediately, debounce subsequent renders
        if (!planned++) update(), queueMicrotask(() => (planned > 1 && update(), planned = 0));
      })
    }
  },

  // redefine evaluator to take second part of expression
  expr => parse(expr.split(/\s+in\s+/)[1])
)
