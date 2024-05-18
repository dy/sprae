import sprae, { directive } from "../core.js";
import store, { _change, _signals } from "../store.js";
import { effect, untracked, computed } from '../signal.js';

// FIXME: add microtask for length change

export const _each = Symbol(":each");

directive.each = (tpl, [itemVar, idxVar, evaluate], state) => {
  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  // we re-create items any time new items are produced
  let cur, keys

  // separate computed effect reduces number of needed updates for the effect
  const items = computed(() => {
    keys = null
    let items = evaluate(state)
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i + 1)
    if (items?.constructor === Object) keys = Object.keys(items), items = Object.values(items)
    return items || []
  })
  let prevl = 0

  return effect(() => {
    // subscribe to items change (.length)
    if (!cur) items.value[_change]?.value

    // add or update
    untracked(() => {
      let i = 0, newItems = items.value, newl = newItems.length

      // plain array update, not store (signal with array) - updates full list
      if (cur && !(cur[_change])) {
        for (let s of cur[_signals] || []) { s[Symbol.dispose]() }
        cur = null, prevl = 0
      }

      // delete
      if (newl < prevl) {
        cur.length = newl
      }
      // update, append, init
      else {
        // init
        if (!cur) {
          cur = newItems
        }
        // update
        else {
          for (; i < prevl; i++) {
            cur[i] = newItems[i]
          }
        }

        // append
        for (; i < newl; i++) {
          cur[i] = newItems[i]
          let idx = i,
            scope = Object.create(state, {
              [itemVar]: { get() { return cur[idx] } },
              [idxVar]: { value: keys ? keys[idx] : idx },
            }),
            el, dispose

          if (tpl.content) {
            el = [...tpl.content.cloneNode(true).childNodes]
            holder.before(...el)
            dispose = () => {
              for (let e of el) e[Symbol.dispose](), e.remove();
            }
          }
          else {
            el = tpl.cloneNode(true)
            holder.before(el)
            dispose = () => (el[Symbol.dispose](), el.remove())
          }

          sprae(el, scope);

          // signal/holder disposal removes element
          ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose] = dispose
        }
      }

      prevl = newl
    })
  })
}


// redefine parser to exclude `[a in] b`
directive.each.parse = (expr, parse) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "$"] = leftSide.split(/\s*,\s*/);

  return [itemVar, idxVar, parse(itemsExpr)]
}
