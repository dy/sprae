import sprae, { parse, prefix, _state, _off, effect, untracked, _change, _touch, _signals, frag, throttle, mutate, signal } from "../core.js"

/** Row data fields on scope objects — symbols stay invisible to `with` identifier lookups */
const _r = Symbol('r'), _c = Symbol('c'), _i = Symbol('i'), _o = Symbol('o'), _is = Symbol('isig')

/** Is name the :text directive (exact, with modifiers, or compound tail) */
const isText = (name, t = prefix + 'text', c = name[t.length]) =>
  name.startsWith(t) && (c === undefined || c === '.' || c === ':')

/** Drop whitespace-only text nodes containing a newline (markup indentation, Vue condense rule);
 * seed empty :text targets with a text node — clones then update .data in place instead of
 * creating + inserting a Text node per row (svelte templates carry the same placeholder) */
const condense = (node) => {
  if (node.localName === 'pre' || node.localName === 'textarea') return
  let child = node.firstChild, next
  while (child) {
    next = child.nextSibling
    if (child.nodeType === 3 && !child.data.trim()) { if (child.data.includes('\n')) child.remove() }
    else if (child.nodeType === 1) condense(child)
    child = next
  }
  if (!node.firstChild && node.attributes && node.localName !== 'template')
    for (let a of node.attributes) if (isText(a.name)) { node.append(''); break }
}

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
  // _i is a plain number; keyed diff moves rows, so index READS must subscribe (#76) —
  // the _is signal materializes lazily on first idx read, rows that never read it skip the alloc
  const desc = {
    [itemVar]: {
      get() { return this[_c] ? this[_c][this[_i]] : this[_r] },
      set(v) { this[_c] ? this[_c][this[_i]] = v : this[_r] = v }
    },
    // `with` fetches it per identifier per eval — own undefined stops the walk to state/globalThis
    [Symbol.unscopables]: { value: undefined },
    // writable defaults let row scopes take the inherited-data write fast path (no proxy walk)
    [_r]: { value: undefined, writable: true },
    [_c]: { value: undefined, writable: true },
    [_i]: { value: undefined, writable: true },
    [_is]: { value: undefined, writable: true },
    [_o]: { value: undefined, writable: true }
  }
  // ??= keeps the item accessor when idx shares its name (`:each="$ in items"`)
  desc[idxVar] ??= {
    get() { let i = (this[_is] ??= signal(this[_i])).value; return this[_o] ? this[_o][i] : i },
    set() { } // index is not assignable
  }
  const proto = Object.create(state, desc)

  /** Move a row to index i: plain field always, signal only if some idx read materialized it */
  const setIdx = (d, i) => { d[_i] = i; if (d[_is]) d[_is].value = i }

  let doc = tpl.ownerDocument
  let holder = tpl._eachHolder || (tpl._eachHolder = doc.createTextNode(""))
  let rowMap = new Map, rows = [], items, keys, cur, keyed = false, gen = 0

  // condense pretty-print whitespace in the clone master (Vue-style: whitespace-only text node
  // with a newline is markup indentation, not content) — it doubles per-row node count otherwise,
  // taxing every clone, insert, layout and teardown; authored single-space gaps stay
  condense(tpl.content || tpl)

  // removal always evicts from rowMap — every path (keyed diff, positional shrink, clear) must, or rows leak
  // el can be null: a row from an aborted (mid-swap) pass whose item vanished before the retry
  let rm = r => { rowMap.delete(r.scope[_r]); if (r.el) { r.el.remove(); r.el[Symbol.dispose]?.() } }

  // all current rows go: one replaceChildren instead of N .remove(), keeping non-row siblings (whitespace, holder).
  // reset=1 means no new keyed rows coexist in rowMap, so clear it once instead of deleting every old key.
  // bail if any keeper is an element — reinserting one could drop focus/iframe/selection state
  let rmAll = reset => {
    let parent = holder.parentNode, keep = [], node
    if (reset) rowMap.clear()
    if (rows.length && !tpl.content && parent?.replaceChildren && rows[0].node.parentNode === parent) {
      for (node = parent.firstChild; node && node !== rows[0].node; node = node.nextSibling)
        if (node.nodeType === 1) { keep = null; break } else keep.push(node)
      if (keep) for (node = holder; node; node = node.nextSibling)
        if (node.nodeType === 1) { keep = null; break } else keep.push(node)
      if (keep) {
        parent.replaceChildren(...keep)
        for (let r of rows) !reset && rowMap.delete(r.scope[_r]), r.el[Symbol.dispose]?.()
        rows.length = 0
        return
      }
    }
    for (let r of rows) reset ? (r.el.remove(), r.el[Symbol.dispose]?.()) : rm(r)
    rows.length = 0
  }

  // _di tracks current DOM index so swap/reorder only touches actually-moved rows;
  // g is the diff generation stamp (replaces a per-update seen-Set)
  // scope shape is uniform (keyed: _r, positional: _c/_o) — monomorphic for the accessors
  let mkrow = (r, c, i) => {
    let d = Object.create(proto)
    d[_r] = r; d[_c] = c; d[_i] = i; d[_o] = keys
    return { el: null, scope: d, node: null, _di: i, g: 0 }
  }

  // element rows pair with tpl as clone master: the first row's scan strips directive attrs off the
  // master, so the rest of the batch clones it clean (no attr-node copies); rows init connected
  // (single fragment insert before init) — a :mount inside a row sees the live document
  let clone = r => (r.node = (r.el = tpl.content ? frag(tpl) : tpl.cloneNode(true)).content || r.el)
  let scanned = 0
  let insert = pending => {
    if (!pending.length) return
    let master = tpl.content ? undefined : tpl, i = 0
    // first row alone: its scan records the program + strips the master before the rest clone it
    if (master && !scanned) {
      scanned = 1
      holder.before(clone(pending[0]))
      sprae(pending[0].el, pending[0].scope, master)
      i = 1
    }
    if (pending.length > i) {
      let f = pending.length - i > 1 ? doc.createDocumentFragment() : null
      for (let j = i; j < pending.length; j++) f ? f.appendChild(clone(pending[j])) : holder.before(clone(pending[j]))
      if (f) holder.before(f)
      for (; i < pending.length; i++) sprae(pending[i].el, pending[i].scope, master)
    }
  }

  // untracked: update reads item signals (src[i]) but must not subscribe the :each effect to them —
  // it re-runs via _change/_touch only, else every index write re-notifies it (O(N) per splice)
  // sync mount, microtask updates: initial render stays synchronous (sprae() returns rendered DOM),
  // later mutations coalesce into ONE consistent diff pass — a leading-edge run on a multi-write
  // mutation (swap) would scan a half-mutated list just to detect the intermediate state and abort.
  // item-level effects (:text/:class) stay synchronous — only list structure defers.
  let mounted = 0, planned = 0, depth = 0
  let flush = () => {
    planned = 0
    // re-entry guard: a doUpdate that mutates the list re-plans another flush — cap runaway loops
    if (++depth > 50) { depth = 0; console.error('∴ Reactive loop detected'); return }
    doUpdate()
    if (!planned) depth = 0
  }
  let update = () => {
    if (!mounted) { mounted = 1; doUpdate(); return }
    if (!planned++) queueMicrotask(flush)
  }
  let doUpdate = () => untracked(() => mutate(() => {
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
          if (!lenChanged && row.scope[_i] !== i) moved = true
          // insert() appends new rows at the tail — a reused row after a new one means wrong placement
          if (pending.length) misplaced = true
          setIdx(row.scope, i); row.scope[_r] = id; row.scope[_o] = keys
          // aborted-pass orphan (never cloned/inserted): enqueue + force placement sweep
          if (!row.el) pending.push(row), misplaced = true
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
        rmAll(1)
        prevl = 0
      }
      cur = src

      if (newl < prevl) {
        if (!newl) rmAll(1)
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
      items[_touch] // O(1) subscribe to index/content changes (swap, splice) on list stores
      update()
    })
    return () => off()
  }
  cb.eval = parse(rhs)
  cb[_off] = () => rmAll(1)
  return cb
}
