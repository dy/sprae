import sprae, { parse, _state, _off, effect, _change, _signals, frag, throttle, mutate } from "../core.js";

// Lightweight row scope — reads item via cur[idx] (positional) or direct ref (keyed).
// Local vars (e.g. :ref) stored in `l` on first write.
const posHandler = {
  get: (s, k) => k === s.v ? s.c?.[s.i] : k === s.k ? (s.o ? s.o[s.i] : s.i) : k === _signals ? s : s.l?.[k] !== undefined ? s.l[k] : s.p?.[k],
  set: (s, k, v) => (k === s.v ? (s.c && (s.c[s.i] = v)) : k === s.k ? 0 : s.l?.[k] !== undefined ? ((s.l[k] = v), 0) : k in (s.p?.[_signals] || {}) ? (s.p[k] = v) : (s.l ||= {})[k] = v, 1),
  has: () => true
}
// Keyed: `r` holds direct item reference — immune to store index shifts
const keyHandler = {
  get: (s, k) => k === s.v ? s.r : k === s.k ? s.i : k === _signals ? s : s.l?.[k] !== undefined ? s.l[k] : s.p?.[k],
  set: (s, k, v) => (k === s.v ? (s.r = v) : k === s.k ? 0 : s.l?.[k] !== undefined ? ((s.l[k] = v), 0) : k in (s.p?.[_signals] || {}) ? (s.p[k] = v) : (s.l ||= {})[k] = v, 1),
  has: () => true
}

/**
 * Each directive - renders list items from array/object/number.
 * Syntax: `:each="item in items"` or `:each="(item, idx) of items"`
 *
 * Keyed by object identity: when items are objects, splice/remove only
 * disposes the removed row — survivors keep their DOM and don't re-evaluate.
 * Primitives fall back to index-based (positional) updates.
 */
export default (tpl, state, expr) => {
  const [lhs, rhs] = expr.split(/\bin|of\b/)
  let [itemVar, idxVar = "$"] = lhs.trim().replace(/\(|\)/g, '').split(/\s*,\s*/);

  let doc = tpl.ownerDocument
  let holder = tpl._eachHolder || (tpl._eachHolder = doc.createTextNode(""));

  // Map<identity, {el, scope, proxy}> for keyed mode
  // Array<{el, scope, proxy}> for positional mode
  let rowMap = new Map, rows = [], items, keys, cur

  // Can we use identity keying? Only for object items.
  let keyed = false

  let update = throttle(() => mutate(() => {
    let newItems = items, newl = newItems.length, prevl = rows.length

    // detect keyed mode: first non-null item is object → keyed
    keyed = false
    for (let i = 0; i < newl; i++) {
      let item = newItems[i]
      if (item != null) { keyed = typeof item === 'object'; break }
    }

    if (keyed && prevl) {
      // --- KEYED DIFF: only when we have existing rows to diff against ---

      // fast path: pure append (list only grew, no removals possible)
      if (newl > prevl && rowMap.size === prevl) {
        let batch = (newl - prevl) > 1 ? doc.createDocumentFragment() : null
        let pending = batch ? [] : null
        for (let i = prevl; i < newl; i++) {
          let identity = newItems[i]
          let scope = { p: state, v: itemVar, k: idxVar, r: identity, i, l: null }
          let proxy = new Proxy(scope, keyHandler)
          let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
          let insertNode = el.content || el
          let row = { el, scope, proxy }
          rowMap.set(identity, row)
          rows.push(row)
          if (batch) { batch.appendChild(insertNode); pending.push([el, proxy]) }
          else { holder.before(insertNode); sprae(el, proxy) }
        }
        if (batch && pending.length) {
          holder.before(batch)
          for (let [el, proxy] of pending) sprae(el, proxy)
        }
      } else {
        // full diff: removals, reorders, mixed insert/remove
        let removed = 0
        if (newl <= prevl) {
          let newSet = new Set
          for (let i = 0; i < newl; i++) newSet.add(newItems[i])
          for (let [identity, row] of rowMap) {
            if (!newSet.has(identity)) {
              row.el[Symbol.dispose]?.(); row.el.remove()
              rowMap.delete(identity); removed++
            }
          }
        }

        let newRows = [], moved = false
        let batch = null, pending = null
        if (newl - rowMap.size > 1) batch = doc.createDocumentFragment(), pending = []

        for (let i = 0; i < newl; i++) {
          let identity = newItems[i], row = rowMap.get(identity)
          if (row) {
            if (row.scope.i !== i) moved = true
            row.scope.i = i; row.scope.r = identity
            newRows.push(row)
          } else {
            let scope = { p: state, v: itemVar, k: idxVar, r: identity, i, l: null }
            let proxy = new Proxy(scope, keyHandler)
            let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
            let insertNode = el.content || el
            row = { el, scope, proxy }
            rowMap.set(identity, row)
            newRows.push(row)
            if (batch) { batch.appendChild(insertNode); pending.push([el, proxy]) }
            else { holder.before(insertNode); sprae(el, proxy) }
          }
        }

        if (batch && pending.length) {
          holder.before(batch)
          for (let [el, proxy] of pending) sprae(el, proxy)
        }

        if (moved || removed) {
          let next = holder
          for (let i = newRows.length - 1; i >= 0; i--) {
            let node = newRows[i].el._holder || newRows[i].el.content || newRows[i].el
            if (node.nextSibling !== next) next.before(node)
            next = node
          }
        }

        rows = newRows
      }
    } else {
      // --- POSITIONAL PATH: index-based (primitives, numbers) ---

      // plain array replaced — full reset
      if (prevl && cur !== newItems && !newItems[_change]) {
        for (let r of rows) { r.el[Symbol.dispose]?.(); r.el.remove() }
        rows.length = 0; prevl = 0; rowMap.clear()
      }
      cur = newItems

      // shrink
      if (newl < prevl) {
        for (let i = newl; i < prevl; i++) { rows[i].el[Symbol.dispose]?.(); rows[i].el.remove() }
        rows.length = newl
      }

      // update surviving rows' item source
      for (let i = 0; i < Math.min(prevl, newl); i++) {
        rows[i].scope.c = newItems
        if (keys) rows[i].scope.o = keys
      }

      // append
      if (newl > prevl) {
        let batch = (newl - prevl) > 1 ? doc.createDocumentFragment() : null
        let pending = batch ? [] : null

        for (let i = prevl; i < newl; i++) {
          let handler = keyed ? keyHandler : posHandler
          let scope = keyed
            ? { p: state, v: itemVar, k: idxVar, r: newItems[i], i, l: null }
            : { p: state, v: itemVar, k: idxVar, c: newItems, i, o: keys, l: null }
          let proxy = new Proxy(scope, handler)
          let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
          let insertNode = el.content || el
          let row = { el, scope }
          rows.push(row)
          if (keyed) rowMap.set(newItems[i], row)

          if (batch) {
            batch.appendChild(insertNode)
            pending.push([el, proxy])
          } else {
            holder.before(insertNode)
            sprae(el, proxy)
          }
        }

        if (batch) {
          holder.before(batch)
          for (let [el, proxy] of pending) sprae(el, proxy)
        }
      }
    }
  }))

  if (tpl.parentNode) mutate(() => tpl.replaceWith(holder))
  tpl[_state] = null

  let disposeAll = () => {
    for (let r of rows) { r.el[Symbol.dispose]?.(); r.el.remove() }
    rows.length = 0; rowMap.clear()
  }

  let cb = value => {
    keys = null
    if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1)
    else if (value?.constructor === Object) keys = Object.keys(value), items = Object.values(value)
    else items = value || []

    let off = effect(() => {
      items[_change]?.value
      update()
    })
    return () => off()
  }
  cb.eval = parse(rhs)
  cb[_off] = disposeAll
  return cb
}
