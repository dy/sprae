import sprae, { parse, _state, _off, effect, _change, _signals, frag, throttle, mutate } from "../core.js";

// Row scope proxies — positional reads item via cur[idx], keyed holds direct ref
const posHandler = {
  get: (s, k) => k === s.v ? s.c?.[s.i] : k === s.k ? (s.o ? s.o[s.i] : s.i) : k === _signals ? s : s.l?.[k] !== undefined ? s.l[k] : s.p?.[k],
  set: (s, k, v) => (k === s.v ? (s.c && (s.c[s.i] = v)) : k === s.k ? 0 : s.l?.[k] !== undefined ? ((s.l[k] = v), 0) : k in (s.p?.[_signals] || {}) ? (s.p[k] = v) : (s.l ||= {})[k] = v, 1),
  has: () => true
}
const keyHandler = {
  get: (s, k) => k === s.v ? s.r : k === s.k ? s.i : k === _signals ? s : s.l?.[k] !== undefined ? s.l[k] : s.p?.[k],
  set: (s, k, v) => (k === s.v ? (s.r = v) : k === s.k ? 0 : s.l?.[k] !== undefined ? ((s.l[k] = v), 0) : k in (s.p?.[_signals] || {}) ? (s.p[k] = v) : (s.l ||= {})[k] = v, 1),
  has: () => true
}

const rm = r => { r.el[Symbol.dispose]?.(); r.el.remove() }

/**
 * Each directive - renders list items from array/object/number.
 * Syntax: `:each="item in items"` or `:each="(item, idx) of items"`
 *
 * Keyed by object identity for plain arrays of objects.
 * Store arrays / primitives use positional (index-based) mode.
 */
export default (tpl, state, expr) => {
  const [lhs, rhs] = expr.split(/\bin|of\b/)
  let [itemVar, idxVar = "$"] = lhs.trim().replace(/\(|\)/g, '').split(/\s*,\s*/)

  let doc = tpl.ownerDocument
  let holder = tpl._eachHolder || (tpl._eachHolder = doc.createTextNode(""))
  let rowMap = new Map, rows = [], items, keys, cur, keyed = false

  let mkrow = (scope, h) => {
    let proxy = new Proxy(scope, h)
    let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
    return { el, scope, proxy, node: el.content || el }
  }

  let insert = pending => {
    if (!pending.length) return
    let f = pending.length > 1 ? doc.createDocumentFragment() : null
    for (let r of pending) f ? f.appendChild(r.node) : holder.before(r.node)
    if (f) holder.before(f)
    for (let r of pending) sprae(r.el, r.proxy)
  }

  let update = throttle(() => mutate(() => {
    let src = items, newl = src.length, prevl = rows.length

    // detect keyed: plain array of objects (store arrays use positional — proxies break identity)
    keyed = false
    if (!src[_change]) for (let i = 0; i < newl; i++) {
      if (src[i] != null) { keyed = typeof src[i] === 'object'; break }
    }

    if (keyed && prevl) {
      // --- KEYED DIFF ---
      let newRows = [], pending = [], moved = false

      for (let i = 0; i < newl; i++) {
        let id = src[i], row = rowMap.get(id)
        if (row) {
          if (row.scope.i !== i) moved = true
          row.scope.i = i; row.scope.r = id
        } else {
          row = mkrow({ p: state, v: itemVar, k: idxVar, r: id, i, l: null }, keyHandler)
          rowMap.set(id, row)
          pending.push(row)
        }
        newRows.push(row)
      }

      // remove stale (works even when list grew but items changed)
      if (rowMap.size > newl) {
        let keep = new Set(src)
        for (let [id, row] of rowMap) if (!keep.has(id)) { rm(row); rowMap.delete(id); moved = true }
      }

      insert(pending)

      if (moved) {
        let next = holder
        for (let i = newRows.length - 1; i >= 0; i--) {
          let n = newRows[i].el._holder || newRows[i].el.content || newRows[i].el
          if (n.nextSibling !== next) next.before(n)
          next = n
        }
      }

      rows = newRows
    } else {
      // --- POSITIONAL ---
      if (prevl && cur !== src) {
        for (let r of rows) rm(r)
        rows.length = 0; prevl = 0; rowMap.clear()
      }
      cur = src

      if (newl < prevl) {
        for (let i = newl; i < prevl; i++) rm(rows[i])
        rows.length = newl
      }

      for (let i = 0; i < Math.min(prevl, newl); i++) {
        rows[i].scope.c = src
        if (keys) rows[i].scope.o = keys
      }

      if (newl > prevl) {
        let pending = []
        for (let i = prevl; i < newl; i++) {
          let row = keyed
            ? mkrow({ p: state, v: itemVar, k: idxVar, r: src[i], i, l: null }, keyHandler)
            : mkrow({ p: state, v: itemVar, k: idxVar, c: src, i, o: keys, l: null }, posHandler)
          rows.push(row)
          if (keyed) rowMap.set(src[i], row)
          pending.push(row)
        }
        insert(pending)
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
    let off = effect(() => { items[_change]?.value; update() })
    return () => off()
  }
  cb.eval = parse(rhs)
  cb[_off] = () => { for (let r of rows) rm(r); rows.length = 0; rowMap.clear() }
  return cb
}
