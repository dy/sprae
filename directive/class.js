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
  let _cur = new Set, _new

  return (v) => {
    _new = new Set
    if (v) clsx(typeof v === 'function' ? v(el.className) : v).split(' ').map(c => c && _new.add(c))
    for (let c of _cur) if (_new.has(c)) _new.delete(c); else el.classList.remove(c);
    for (let c of _cur = _new) el.classList.add(c)
  }
}
