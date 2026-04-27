import { frag } from "../core.js"

/**
 * Text directive - sets textContent reactively.
 * Preserves caret/selection position across updates.
 * @param {Element | HTMLTemplateElement} el - Target element
 * @returns {(v: any) => void} Update function
 */
export default el => (
  // <template :text="a"/> or previously initialized template
  el.content && el.replaceWith(el = frag(el).childNodes[0]),
  v => {
    v = typeof v === 'function' ? v(el.textContent) : v
    v = v == null ? "" : "" + v
    let cur = el.textContent
    if (cur === v) return

    // append-only: reuse text node, skip caret save/restore
    let node = el.firstChild
    if (node && v.startsWith(cur)) { node.appendData(v.slice(cur.length)); return }

    // caret preservation only matters when this element holds focus —
    // calling getSelection() during DOM mutations forces sync layout in Chromium (O(n²) for lists)
    let root = el.ownerDocument, active = root.activeElement
    let s = active && (active === el || el.contains(active)) ? root.getSelection?.() : null
    let off = s?.rangeCount && el.contains(s.anchorNode) ? s.getRangeAt(0).startOffset : -1

    el.textContent = v

    // restore caret
    if (off >= 0 && el.firstChild) {
      let pos = Math.min(off, el.firstChild.textContent.length)
      let r = new Range()
      r.setStart(el.firstChild, pos)
      r.collapse(true)
      s.removeAllRanges()
      s.addRange(r)
    }
  }
)
