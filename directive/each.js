import sprae, { parse, _state, _off, effect, untracked, _change, _touch, _signals, frag, throttle, mutate, signal } from "../core.js"

/** Row data fields on scope objects — symbols stay invisible to `with` identifier lookups */
const _r = Symbol('r'), _c = Symbol('c'), _i = Symbol('i'), _o = Symbol('o')

/**
 * Each directive - renders list items from array/object/number.
 * Syntax: `:each="item in items"` or `:each="(item, idx) of items"`
 *
 * Keyed by object identity for arrays of objects (including store arrays).
 * Primitives use positional (index-based) mode.
 */
export default (tpl, state, expr) => {
  // first standalone `in`/`of` splits the expression — `\b` on both sides so `includes`, `index`, `typeof` etc. in rhs don't match
  const [, lhs, rhs] = expr.match(/^(.*?)\b(?:in|of)\b(.*)$/s) || []
  let [itemVar, idxVar = "$"] = lhs.trim().replace(/\(|\)/g, '').split(/\s*,\s*/)

  // Row scope is a plain object prototype-chained to state (proxy stays only at the chain bottom):
  // `with` identifier lookups resolve item/idx via native own-prop getters — no proxy trap crossings.
  // Positional rows (_c = source array) read item live via c[i], keyed rows hold direct ref _r.
  // _i is a signal: keyed diff moves rows to new indices, so index reads must subscribe (#76)
  const desc = {
    [itemVar]: {
      get() { return this[_c] ? this[_c][this[_i].peek()] : this[_r] },
      set(v) { this[_c] ? this[_c][this[_i].peek()] = v : this[_r] = v }
    },
    // `with` fetches it per identifier per eval — own undefined stops the walk to state/globalThis
    [Symbol.unscopables]: { value: undefined },
    // writable defaults let row scopes take the inherited-data write fast path (no proxy walk)
    [_r]: { value: undefined, writable: true },
    [_c]: { value: undefined, writable: true },
    [_i]: { value: undefined, writable: true },
    [_o]: { value: undefined, writable: true }
  }
  // ??= keeps the item accessor when idx shares its name (`:each="$ in items"`)
  desc[idxVar] ??= {
    get() { let i = this[_i].value; return this[_o] ? this[_o][i] : i },
    set() { } // index is not assignable
  }
  const proto = Object.create(state, desc)

  let doc = tpl.ownerDocument
  let holder = tpl._eachHolder || (tpl._eachHolder = doc.createTextNode(""))
  let rowMap = new Map, rows = [], items, keys, cur, keyed = false, gen = 0

  // removal always evicts from rowMap — every path (keyed diff, positional shrink, clear) must, or rows leak
  let rm = r => { rowMap.delete(r.scope[_r]); r.el.remove(); r.el[Symbol.dispose]?.() }

  // all current rows go: one replaceChildren instead of N .remove(), keeping non-row siblings (whitespace, holder).
  // bail if any keeper is an element — reinserting one could drop focus/iframe/selection state
  let rmAll = () => {
    let parent = holder.parentNode, keep = [], node
    if (rows.length && !tpl.content && parent?.replaceChildren && rows[0].node.parentNode === parent) {
      for (node = parent.firstChild; node && node !== rows[0].node; node = node.nextSibling)
        if (node.nodeType === 1) { keep = null; break } else keep.push(node)
      if (keep) for (node = holder; node; node = node.nextSibling)
        if (node.nodeType === 1) { keep = null; break } else keep.push(node)
      if (keep) {
        parent.replaceChildren(...keep)
        for (let r of rows) rowMap.delete(r.scope[_r]), r.el[Symbol.dispose]?.()
        rows.length = 0
        return
      }
    }
    for (let r of rows) rm(r)
    rows.length = 0
  }

  // _di tracks current DOM index so swap/reorder only touches actually-moved rows;
  // g is the diff generation stamp (replaces a per-update seen-Set)
  // scope shape is uniform (keyed: _r, positional: _c/_o) — monomorphic for the accessors
  let mkrow = (r, c, i) => {
    let d = Object.create(proto)
    d[_r] = r; d[_c] = c; d[_i] = signal(i); d[_o] = keys
    let el = tpl.content ? frag(tpl) : tpl.cloneNode(true)
    return { el, scope: d, node: el.content || el, _di: i, g: 0 }
  }

  let insert = pending => {
    if (!pending.length) return
    let f = pending.length > 1 ? doc.createDocumentFragment() : null
    for (let r of pending) f ? f.appendChild(r.node) : holder.before(r.node)
    if (f) holder.before(f)
    // element rows pair with tpl as clone master: first row records the directive scan, rest replay it
    for (let r of pending) sprae(r.el, r.scope, tpl.content ? undefined : tpl)
  }

  // untracked: update reads item signals (src[i]) but must not subscribe the :each effect to them —
  // it re-runs via _change/_touch only, else every index write re-notifies it (O(N) per splice)
  let update = throttle(() => untracked(() => mutate(() => {
    let src = items, newl = src.length, prevl = rows.length, lenChanged = newl !== prevl,
      // raw signal peek — same item identity as proxy reads, minus per-index trap crossings
      sigs = src[_signals], s,
      val = sigs ? i => (s = sigs[i], s?.peek ? s.peek() : s) : i => src[i]

    // detect keyed: array of objects (store items are shallow proxies — keyed by proxy identity)
    keyed = false
    for (let i = 0; i < newl; i++) {
      if (val(i) != null) { keyed = typeof val(i) === 'object'; break }
    }

    if (keyed && prevl) {
      let newRows = [], pending = [], moved = false, misplaced = false, reused = 0
      gen++

      for (let i = 0; i < newl; i++) {
        let id = val(i)
        let row = rowMap.get(id)
        if (row) {
          if (row.g === gen) return // intermediate swap — retry after next index write
          reused++
          // index-only shifts from remove/append keep DOM order — reorder only for same-length permutes (swap)
          if (!lenChanged && row.scope[_i].peek() !== i) moved = true
          // insert() appends new rows at the tail — a reused row after a new one means wrong placement
          if (pending.length) misplaced = true
          row.scope[_i].value = i; row.scope[_r] = id; row.scope[_o] = keys
        } else {
          row = mkrow(id, null, i)
          rowMap.set(id, row)
          pending.push(row)
        }
        row.g = gen
        newRows.push(row)
      }

      // clear/replace-all: nothing reused — bulk-remove old rows (rowMap already holds new entries, rmAll evicts by old row)
      if (!reused) rmAll()
      else for (let [id, row] of rowMap) if (row.g !== gen) rm(row)

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
        // 2-node swap fast path (common case: JFB swap rows) — sibling moves only:
        // a text-node placeholder inside <tbody> churns table anonymous boxes
        if (fix.length === 2) {
          let a = fix[0].node, b = fix[1].node, an = a.nextSibling, bn = b.nextSibling
          if (an === b) b.after(a)
          else if (bn === a) a.after(b)
          else { bn.before(a); an.before(b) }
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
        rmAll()
        prevl = 0; rowMap.clear()
      }
      cur = src

      if (newl < prevl) {
        if (!newl) rmAll()
        else {
          for (let i = newl; i < prevl; i++) rm(rows[i])
          rows.length = newl
        }
      }

      for (let i = 0; i < Math.min(prevl, newl); i++) {
        rows[i].scope[_c] = src
        if (keys) rows[i].scope[_o] = keys
      }

      if (newl > prevl) {
        let pending = []
        for (let i = prevl; i < newl; i++) {
          let row = keyed ? mkrow(val(i), null, i) : mkrow(null, src, i)
          rows.push(row)
          if (keyed) rowMap.set(row.scope[_r], row)
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
  cb[_off] = () => { rmAll(); rowMap.clear() }
  return cb
}
