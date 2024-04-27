import sprae, { directive } from "../core.js";
import store, { _signals } from "../store.js";
import { effect, untracked } from '../signal.js';

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

  return () => {
    // called whenever state or length changes
    let items = evaluate(state)?.valueOf()

    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i)

    let i = 0, l = cur?.length || 0

    // add or update
    untracked(() => {
      let newl = items.length
      if (newl >= l) {
        // update
        if (cur) {
          for (; i < l; i++) {
            cur[i] = items[i]
          }
        }
        else cur = items

        // add
        for (; i < newl; i++) {
          cur[i] = items[i]

          const idx = i,
            el = tpl.cloneNode(true),
            scope = Object.create(state, {
              [itemVar]: { get() { return cur[idx] } },
              [idxVar]: { value: idx },
            })
          holder.before(el)
          sprae(el, scope)

          // additional disposal
          cur[_signals][i][Symbol.dispose] = () => { el.remove(); }
        }
      }
      // delete
      else {
        cur.length = newl
      }
    })
  }
}


// redefine parser to exclude `[a in] b`
directive.each.parse = (expr, parse) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "$"] = leftSide.split(/\s*,\s*/);

  return [itemVar, idxVar, parse(itemsExpr)]
}
