import sprae, { parse, _state, _off, effect, _change, _signals, frag, throttle, mutate } from "../core.js";

// Row scope proxy — reads item via cur[idx] (positional, has `c`) or direct ref (keyed, has `r`).
// Local vars stored in `l` on first write.
const handler = {
  get: (s, k) => k === s.v ? ('c' in s ? s.c?.[s.i] : s.r) : k === s.k ? ('c' in s ? (s.o ? s.o[s.i] : s.i) : s.i) : k === _signals ? s : s.l?.[k] !== undefined ? s.l[k] : s.p?.[k],
  set: (s, k, v) => (k === s.v ? ('c' in s ? (s.c && (s.c[s.i] = v)) : (s.r = v)) : k === s.k ? 0 : s.l?.[k] !== undefined ? ((s.l[k] = v), 0) : k in (s.p?.[_signals] || {}) ? (s.p[k] = v) : (s.l ||= {})[k] = v, 1),
  has: () => true
}

const dispose = r => { r.el[Symbol.dispose]?.(); r.el.remove() }

const mkrow = (tpl, scope) => {
  let proxy = new Proxy(scope, handler)
  let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
  return { el, scope, proxy, node: el.content || el }
}

const flush = (batch, pending, holder) => {
  for (let [el, proxy] of pending) sprae(el, proxy)
  holder.before(batch)
}

/**
 * Each directive - renders list items from array/object/number.
 * Syntax: `:each="item in items"` or `:each="(item, idx) of items"`
 *
 * Keyed by object identity for plain arrays of objects.
 * Store arrays / primitives use positional (index-based) mode.
 */
export default (tpl, state, expr) => {
  const [lhs, rhs] = expr.split(/\bin|of\b/)
  let [itemVar, idxVar = "$"] = lhs.trim().replace(/\(|\)/g, '').split(/\s*,\s*/);

  let doc = tpl.ownerDocument
  let holder = tpl._eachHolder || (tpl._eachHolder = doc.createTextNode(""));
  let rowMap = new Map, rows = [], items, keys, cur, keyed = false

  let update = throttle(() => mutate(() => {
    let newItems = items, newl = newItems.length, prevl = rows.length

    // detect keyed: object items in plain (non-store) arrays only
    keyed = false
    if (!newItems[_change]) for (let i = 0; i < newl; i++) {
      let item = newItems[i]
      if (item != null) { keyed = typeof item === 'object'; break }
    }

    if (keyed && prevl) {
      // --- KEYED DIFF ---
      // remove stale rows
      if (newl <= prevl) {
        let newSet = new Set(newl > 0 ? newItems : [])
        for (let [identity, row] of rowMap) {
          if (!newSet.has(identity)) { dispose(row); rowMap.delete(identity) }
        }
      }

      let newRows = [], moved = false
      let batch = newl - rowMap.size > 1 ? doc.createDocumentFragment() : null
      let pending = batch ? [] : null

      for (let i = 0; i < newl; i++) {
        let identity = newItems[i], row = rowMap.get(identity)
        if (row) {
          if (row.scope.i !== i) moved = true
          row.scope.i = i; row.scope.r = identity
        } else {
          row = mkrow(tpl, { p: state, v: itemVar, k: idxVar, r: identity, i, l: null })
          rowMap.set(identity, row)
          if (batch) { batch.appendChild(row.node); pending.push([row.el, row.proxy]) }
          else { holder.before(row.node); sprae(row.el, row.proxy) }
        }
        newRows.push(row)
      }

      if (batch && pending.length) flush(batch, pending, holder)

      if (moved || newl < prevl) {
        let next = holder
        for (let i = newRows.length - 1; i >= 0; i--) {
          let node = newRows[i].el._holder || newRows[i].el.content || newRows[i].el
          if (node.nextSibling !== next) next.before(node)
          next = node
        }
      }

      rows = newRows
    } else {
      // --- POSITIONAL PATH ---
      // array replaced — full reset
      if (prevl && cur !== newItems) {
        for (let r of rows) dispose(r)
        rows.length = 0; prevl = 0; rowMap.clear()
      }
      cur = newItems

      // shrink
      if (newl < prevl) {
        for (let i = newl; i < prevl; i++) dispose(rows[i])
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
          let scope = keyed
            ? { p: state, v: itemVar, k: idxVar, r: newItems[i], i, l: null }
            : { p: state, v: itemVar, k: idxVar, c: newItems, i, o: keys, l: null }
          let row = mkrow(tpl, scope)
          rows.push(row)
          if (keyed) rowMap.set(newItems[i], row)

          if (batch) { batch.appendChild(row.node); pending.push([row.el, row.proxy]) }
          else { holder.before(row.node); sprae(row.el, row.proxy) }
        }

        if (batch) flush(batch, pending, holder)
      }
    }
  }))

  if (tpl.parentNode) mutate(() => tpl.replaceWith(holder))
  tpl[_state] = null

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
  cb[_off] = () => { for (let r of rows) dispose(r); rows.length = 0; rowMap.clear() }
  return cb
}
