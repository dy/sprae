import sprae, { attr, _dispose } from "../core.js";

/**
 * Value directive - one-way binding (state → DOM).
 * Sets element value/checked/selected from state.
 * For write-back (DOM → state), use :change directive.
 *
 * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} el - Form element
 * @param {Object} state - State object
 * @returns {(value: any) => void} Update function
 */
export default (el, state) => {
  // select elements need children spraed first (for :each options)
  if (el.type?.startsWith('select')) sprae(el, state)

  return (el.type === "text" || el.type === "" || el.tagName === "TEXTAREA") ?
    (value, _from, _to) => (
      _from = el.selectionStart,
      _to = el.selectionEnd,
      el.setAttribute("value", (el.value = value == null ? "" : value)),
      _from && el.setSelectionRange(_from, _to)
    ) :
    (el.type === "checkbox") ?
      (value) => (el.checked = value, attr(el, "checked", value)) :
      (el.type === 'radio') ? (value) => (
        el.checked = el.value === value, attr(el, 'checked', el.checked || null)
      ) :
        (el.type === "select-one") ?
          (value) => {
            for (let o of el.options)
              o.value == value ? o.setAttribute("selected", '') : o.removeAttribute("selected");
            el.value = value;
          } :
          (el.type === 'select-multiple') ? (value) => {
            for (let o of el.options) value.some(v => v == o.value) ? o.setAttribute('selected', '') : o.removeAttribute('selected')
          } :
            (value) => (el.value = value)
}
