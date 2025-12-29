import sprae, { store, parse, _state, effect, _change, _signals, frag, throttle, debounce, mutate } from "../core.js";

/**
 * Each directive - renders list items from array/object/number.
 * Syntax: `:each="item in items"` or `:each="(item, idx) of items"`
 * @param {HTMLTemplateElement | Element} tpl - Template element
 * @param {Object} state - State object
 * @param {string} expr - Iterator expression
 * @returns {{ eval: Function, [Symbol.dispose]: () => void }} Directive result
 */
export default (tpl, state, expr) => {
  const [lhs, rhs] = expr.split(/\bin|of\b/)

  let [itemVar, idxVar = "$"] = lhs.trim().replace(/\(|\)/g, '').split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  let holder = tpl.ownerDocument.createTextNode("");

  // we re-create items any time new items are produced
  let cur, keys, items, prevl = 0

  let update = throttle(() => mutate(() => {
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

      // batch append using DocumentFragment for efficiency
      let batchSize = newl - i
      let batch = batchSize > 1 ? document.createDocumentFragment() : null
      let pending = batch ? [] : null

      // append
      for (; i < newl; i++) {
        cur[i] = newItems[i]

        let idx = i
        let el = tpl.content ? frag(tpl) : tpl.cloneNode(true);
        // el.content is DocumentFragment for frag() output, el itself for cloneNode
        let insertNode = el.content || el

        // collect for batch insert
        if (batch) {
          batch.appendChild(insertNode)
          pending.push([ el, idx ])
        } else {
          holder.before(insertNode)
          let subscope = store({
            get [itemVar]() { return cur[idx] },
            [idxVar]: keys ? keys[idx] : idx
          }, state)
          sprae(el, subscope)
        }

        // signal/holder disposal removes element
        let _prev = ((cur[_signals] ||= [])[i] ||= {})[Symbol.dispose]
        cur[_signals][i][Symbol.dispose] = () => {
          _prev?.(), el[Symbol.dispose]?.(), el.remove()
        };
      }

      // batch insert all at once, then sprae
      if (batch) {
        holder.before(batch)
        for (let [el, idx] of pending) {
          let subscope = store({
            get [itemVar]() { return cur[idx] },
            [idxVar]: keys ? keys[idx] : idx
          }, state)
          sprae(el, subscope)
        }
      }
    }

    prevl = newl
  }))

  mutate(() => tpl.replaceWith(holder))
  tpl[_state] = null // mark as fake-spraed, to preserve :-attribs for template

  return Object.assign(value => {
    // resolve new items
    keys = null
    if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1)
    else if (value?.constructor === Object) keys = Object.keys(value), items = Object.values(value)
    else items = value || []

    // whenever list changes, we rebind internal change effect
    return effect(() => {
      // subscribe to items change (.length) - we do it every time (not just in update) since preact signals unsubscribes unused signals
      items[_change]?.value

      // make first render immediately, debounce subsequent renders
      update()
    })
  }, {eval:parse(rhs)})
}
