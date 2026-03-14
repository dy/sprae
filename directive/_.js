import { attr, isCE } from "../core.js";

/**
 * Default attribute directive - sets any attribute value.
 * @param {Element} el - Target element
 * @param {Object} st - State object
 * @param {string} ex - Expression
 * @param {string} name - Attribute name
 * @returns {(v: any) => void} Update function
 */
export default (el, st, ex, name) => v => attr(el, name, typeof v === 'function' && !isCE(el) ? v(el.getAttribute(name)) : v)
