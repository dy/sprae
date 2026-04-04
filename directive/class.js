import { clsx } from "../core.js";

/**
 * Class directive - manages CSS classes reactively.
 * Supports strings, arrays, and objects (like clsx/classnames).
 * @param {Element} el - Target element
 * @param {Object} st - State object
 * @param {string} ex - Expression
 * @param {string} name - Directive name with modifiers
 * @returns {(v: string | string[] | Record<string, boolean>) => void} Update function
 */
export default (el, st, ex, name) => {
  let _cur = null, _new, _prev = null
  let clearAttr = () => !el.classList.length && el.removeAttribute('class')

  return (v) => {
    v = typeof v === 'function' ? v(el.className) : v

    if (v?.constructor === Object) {
      _prev = null
      if (_cur) for (let c of _cur) if (!v[c]) el.classList.remove(c), _cur.delete(c)
      if (!_cur?.size) _cur = null
      for (let c in v) if (v[c] && !_cur?.has(c)) el.classList.add(c), (_cur ||= new Set).add(c)
      if (!_cur) clearAttr()
      return
    }

    v = clsx(v)
    if (v === _prev) return
    _prev = v

    _new = null
    if (v) for (let c of v.split(' ')) c && (_new ||= new Set).add(c)
    if (_cur) for (let c of _cur) if (!_new?.has(c)) el.classList.remove(c)
    if (_new) for (let c of _new) if (!_cur?.has(c)) el.classList.add(c)
    if (!_new) clearAttr()
    _cur = _new
  }
}
