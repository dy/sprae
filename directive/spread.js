import { attr, dashcase } from "../core.js";

/**
 * Spread directive - sets multiple attributes from object.
 * Keys are converted from camelCase to kebab-case.
 * @param {Element} target - Target element
 * @returns {(value: Record<string, any>) => void} Update function
 */
export default (target) => value => { for (let key in value) attr(target, dashcase(key), value[key]) }
