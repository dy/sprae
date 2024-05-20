import sprae, { directive } from "../core.js";
import { _change, _signals } from "../store.js";
import { effect, untracked, computed } from '../signal.js';


export const _each = Symbol(":each");

directive.each = (tpl, [itemVar, idxVar, evaluate], state) => {
  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  // we re-create items any time new items are produced
  let cur, keys, prevl = 0

  // separate computed effect reduces number of needed updates for the effect
  const items = computed(() => {
    keys = null
    let items = evaluate(state)
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i + 1)
    if (items?.constructor === Object) keys = Object.keys(items), items = Object.values(items)
    return items || []
  })

  const update = () => {
    // NOTE: untracked avoids rerendering full list whenever internal items or props change
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
            el = (tpl.content || tpl).cloneNode(true),
            frag = tpl.content ?
              // fake fragment to init sprae
              { children: [...el.children], remove() { this.children.map(el => el.remove()) } } :
              el;

          holder.before(el);
          sprae(frag, scope);

          // signal/holder disposal removes element
          ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose] = () => {
            frag[Symbol.dispose](), frag.remove()
          };
        }
      }

      prevl = newl
    })
  }

  let planned = 0
  return effect(() => {
    // subscribe to items change (.length)
    if (!cur) items.value[_change]?.value

    // make first render immediately, debounce subsequent renders
    if (!planned) {
      update()
      queueMicrotask(() => (planned && update(), planned = 0))
    } else planned++
  })
}


// redefine parser to exclude `[a in] b`
directive.each.parse = (expr, parse) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "$"] = leftSide.split(/\s*,\s*/);

  return [itemVar, idxVar, parse(itemsExpr)]
}
