import { attr } from "../core.js";

/**
 * Style directive - sets inline styles reactively.
 * Accepts string or object. Preserves static styles.
 * @param {Element} el - Target element
 * @param {Object} st - State object
 * @param {string} ex - Expression
 * @param {string} name - Directive name with modifiers
 * @returns {(v: string | Record<string, string> | ((style: CSSStyleDeclaration) => any)) => void} Update function
 */
export default (el, st, ex, name) => {
  let _static;

  return v => {
    if (_static === undefined) _static = el.getAttribute("style") ?? ""
    v = typeof v === "function" ? v(el.style) : v
    if (typeof v === "string") attr(el, "style", _static ? _static + '; ' + v : v)
    else {
      if (_static) attr(el, "style", _static);
      // NOTE: we skip names not starting with a letter - eg. el.style stores properties as { 0: --x } or JSDOM has _pfx
      for (let k in v) k[0] == '-' ? el.style.setProperty(k, v[k]) : k[0] > 'A' && (el.style[k] = v[k])
    }
  }
}
