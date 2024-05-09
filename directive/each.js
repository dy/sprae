import sprae, { directive } from "../core.js";
import store, { _change, _signals } from "../store.js";
import { effect, untracked, computed } from '../signal.js';

// FIXME: add microtask for length change

export const _each = Symbol(":each");

directive.each = (tpl, [itemVar, idxVar, evaluate], state) => {
  // we have to handle item :ref separately if don't create substates
  // const refName = tpl.getAttribute(':ref') || ''
  // if (refName) tpl.removeAttribute(':ref')

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode("")), parent = tpl.parentNode;
  tpl.replaceWith(holder);

  // we re-create items any time new items are produced
  let cur

  // separate computed effect reduces number of needed updates for the effect
  const items = computed(() => {
    let items = evaluate(state)
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i)
    return items || []
  })
  let prevl = 0

  return () => {
    // subscribe to items change (incl length)
    if (!cur) {
      items.value.length
    }

    // add or update
    untracked(() => {
      let i = 0, newItems = items.value, newl = newItems.length

      // plain array update, not store (signal with array) - updates full list
      if (cur && !cur[_change]) {
        for (let s of cur[_signals] || []) s[Symbol.dispose]()
        cur = null, prevl = 0
      }

      if (newl >= prevl) {
        if (!cur) {
          cur = newItems
        }
        else {
          // update
          for (; i < prevl; i++) {
            cur[i] = newItems[i]
          }
        }

        // add
        for (; i < newl; i++) {
          cur[i] = newItems[i]

          const idx = i,
            el = tpl.cloneNode(true),
            // NOTE: can't do Object.create here since our new scope can be modified by item (like :ref="el"), so we need to keep root scope untacted
            // scope = Object.create(state, {
            //   [itemVar]: { get() { return cur[idx] } },
            //   [idxVar]: { value: idx },
            // })
            scope = store({
              [itemVar]: cur[_signals]?.[i] ?? cur[i],
              [idxVar]: idx
            }, state)

          holder.before(el)
          sprae(el, scope);

          // signal/holder disposal removes element
          ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose] = () => { el.remove(); }
        }
      }
      // delete
      else {
        cur.length = newl
      }

      prevl = newl
    })
  }
}


// redefine parser to exclude `[a in] b`
directive.each.parse = (expr, parse) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "$"] = leftSide.split(/\s*,\s*/);

  return [itemVar, idxVar, parse(itemsExpr)]
}
