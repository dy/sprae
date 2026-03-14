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
    v = v == null ? "" : v
    if (el.textContent === v) return

    // save caret position
    let s = el.getRootNode().getSelection?.()
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
