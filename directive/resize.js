import { parse } from "../core.js"

/**
 * Resize directive - observes element size changes.
 * Calls expression with [width, height] tuple.
 * @param {Element} el - Target element
 * @param {Object} state - State object
 * @param {string} expr - Expression receiving size tuple
 * @returns {{ [Symbol.dispose]: () => void }} Disposal object
 */
export default (el, state, expr) => {
  const evaluate = parse(expr).bind(el)
  const resizeObserver = new ResizeObserver((entries) => {
    evaluate([entries[0].contentRect.width, entries[0].contentRect.height]);
  });
  resizeObserver.observe(el);
  return {[Symbol.dispose](){ resizeObserver.unobserve(el); }};
};
