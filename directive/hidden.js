/**
 * Hidden directive - toggles the hidden attribute.
 * @param {Element} el - Target element
 * @returns {(value: any) => boolean} Update function
 */
export default (el) => (value) => el.hidden = !!value
