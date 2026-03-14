import { attr, dashcase, isCE } from "../core.js";

/**
 * Spread directive - sets multiple attributes from object.
 * Keys are converted from camelCase to kebab-case.
 * @param {Element} target - Target element
 * @returns {(value: Record<string, any>) => void} Update function
 */
export default (target) => value => { let ce = isCE(target); for (let key in value) attr(target, ce ? key : dashcase(key), value[key]) }
