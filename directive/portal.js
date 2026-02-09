/**
 * Portal directive - teleports element to another container.
 * Value can be selector string, element, or falsy to return home.
 * @param {Element} el - Element to teleport
 * @param {Object} state - State object
 * @param {string} expr - Expression
 * @returns {(value: string | Element | null | false) => void} Update function
 */
export default (el, state, expr) => {
  const comment = el.ownerDocument.createComment(':portal')
  let currentTarget = null

  // Insert placeholder before element
  el.before(comment)

  return (value) => {
    // Resolve target: selector string, element, or null/false to return home
    // For selectors, first try within the same root, then document
    const root = el.getRootNode()
    const target = typeof value === 'string'
      ? (root.querySelector?.(value) || el.ownerDocument.querySelector(value))
      : value instanceof Element ? value
        : value ? el.ownerDocument.body : null

    // No change needed
    if (target === currentTarget) return

    if (target) {
      // Move to target
      target.appendChild(el)
    } else {
      // Return home (after placeholder)
      comment.after(el)
    }

    currentTarget = target
  }
}
