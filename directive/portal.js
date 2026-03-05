/**
 * Portal directive - teleports element to another container.
 * Value can be selector string, element, or falsy to return home.
 * @param {Element} el - Element to teleport
 * @param {Object} state - State object
 * @param {string} expr - Expression
 * @returns {(value: string | Element | null | false) => void} Update function
 */
export default (el, state, expr) => {
  const doc = el.ownerDocument
  const comment = doc.createComment(':portal')
  let currentTarget = null

  // Insert placeholder before element
  el.before(comment)

  return (value) => {
    const root = el.getRootNode()
    const target = typeof value === 'string'
      ? (root.querySelector?.(value) || doc.querySelector(value))
      : value?.nodeType === 1 ? value
        : value ? doc.body : null

    if (target === currentTarget) return

    if (target) target.appendChild(el)
    else comment.after(el)

    currentTarget = target

    return () => { currentTarget && (comment.after(el), currentTarget = null) }
  }
}
