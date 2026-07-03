import sprae, { parse, _state, _off, effect, untracked, _change, _touch, _signals, frag, throttle, mutate } from "../core.js"

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


/**
 * Each directive - renders list items from array/object/number.
 * Syntax: `:each="item in items"` or `:each="(item, idx) of items"`
 *
 * Keyed by object identity for arrays of objects (including store arrays).
 * Primitives use positional (index-based) mode.
 */
export default (tpl, state, expr) => {
  const [lhs, rhs] = expr.split(/\bin|of\b/)
  let [itemVar, idxVar = "$"] = lhs.trim().replace(/\(|\)/g, '').split(/\s*,\s*/)

  let doc = tpl.ownerDocument
  let holder = tpl._eachHolder || (tpl._eachHolder = doc.createTextNode(""))
  let rowMap = new Map, rows = [], items, keys, cur, keyed = false

  // removal always evicts from rowMap — every path (keyed diff, positional shrink, clear) must, or rows leak
  let rm = r => { rowMap.delete(r.scope.r); r.el.remove(); r.el[Symbol.dispose]?.() }

  // _di tracks current DOM index so swap/reorder only touches actually-moved rows
  let mkrow = (scope, h) => {
    let proxy = new Proxy(scope, h)
    let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
    return { el, scope, proxy, node: el.content || el, _di: scope.i }
  }

  let insert = pending => {
    if (!pending.length) return
    let f = pending.length > 1 ? doc.createDocumentFragment() : null
    for (let r of pending) f ? f.appendChild(r.node) : holder.before(r.node)
    if (f) holder.before(f)
    // element rows pair with tpl as clone master: first row records the directive scan, rest replay it
    for (let r of pending) sprae(r.el, r.proxy, tpl.content ? undefined : tpl)
  }

  // untracked: update reads item signals (src[i]) but must not subscribe the :each effect to them —
  // it re-runs via _change/_touch only, else every index write re-notifies it (O(N) per splice)
  let update = throttle(() => untracked(() => mutate(() => {
    let src = items, newl = src.length, prevl = rows.length, lenChanged = newl !== prevl

    // detect keyed: array of objects (store items are shallow proxies — keyed by proxy identity)
    keyed = false
    for (let i = 0; i < newl; i++) {
      if (src[i] != null) { keyed = typeof src[i] === 'object'; break }
    }

    if (keyed && prevl) {
      let newRows = [], pending = [], seen = new Set(), moved = false, misplaced = false

      for (let i = 0; i < newl; i++) {
        let id = src[i]
        if (id != null && typeof id === 'object') {
          if (seen.has(id)) return // intermediate swap — retry after next index write
          seen.add(id)
        }
        let row = rowMap.get(id)
        if (row) {
          // index-only shifts from remove/append keep DOM order — reorder only for same-length permutes (swap)
          if (!lenChanged && row.scope.i !== i) moved = true
          // insert() appends new rows at the tail — a reused row after a new one means wrong placement
          if (pending.length) misplaced = true
          row.scope.i = i; row.scope.r = id
        } else {
          row = mkrow({ p: state, v: itemVar, k: idxVar, r: id, i, l: null }, keyHandler)
          rowMap.set(id, row)
          pending.push(row)
        }
        newRows.push(row)
      }

      for (let [id, row] of rowMap) if (!seen.has(id)) rm(row)

      insert(pending)

      if (misplaced) {
        // new rows sit at the tail — sweep everything into list order
        let next = holder
        for (let i = newRows.length - 1; i >= 0; i--) {
          let n = newRows[i].node
          if (n.nextSibling !== next) next.before(n)
          next = n
          newRows[i]._di = i
        }
      }
      else if (moved) {
        // collect rows whose DOM position no longer matches their list index
        let fix = []
        for (let i = 0; i < newRows.length; i++) {
          let row = newRows[i]
          if (row._di !== i) fix.push(row)
          row._di = i
        }
        // 2-node swap fast path (common case: JFB swap rows)
        if (fix.length === 2) {
          let a = fix[0].node, b = fix[1].node, t = doc.createTextNode('')
          a.replaceWith(t); b.replaceWith(a); t.replaceWith(b)
        } else {
          // general reorder: backward sweep, only move rows that aren't already in place
          let next = holder
          for (let i = newRows.length - 1; i >= 0; i--) {
            let n = newRows[i].node
            if (n.nextSibling !== next) next.before(n)
            next = n
          }
        }
      } else for (let i = 0; i < newRows.length; i++) newRows[i]._di = i

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
  })))

  if (tpl.parentNode) mutate(() => tpl.replaceWith(holder))
  tpl[_state] = null

  let cb = value => {
    keys = null
    if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1)
    else if (value?.constructor === Object) keys = Object.keys(value), items = Object.values(value)
    else items = value || []
    let off = effect(() => {
      items[_change]?.value
      items[_touch] // O(1) subscribe to index/content changes (swap, splice) on list stores
      update()
    })
    return () => off()
  }
  cb.eval = parse(rhs)
  cb[_off] = () => { for (let r of rows) rm(r); rows.length = 0; rowMap.clear() }
  return cb
}
