/**
 * Effect directive - runs side effects.
 * Calls function result if expression evaluates to a function.
 * @returns {(fn: any) => any} Update function
 */
export default () => (fn) => typeof fn === 'function' && fn()
