import sprae, { attr, parse, _state } from "../core.js";

/**
 * Creates a setter function for two-way binding.
 * @param {string} expr - Expression to assign to
 * @returns {(target: Object, value: any) => void} Setter function
 */
export const setter = (expr, _set = parse(`${expr}=__`)) => (target, value) => {
  target.__ = value; _set(target), delete target.__
}

/**
 * Value directive - two-way binding for form elements.
 * Supports text, checkbox, radio, select, and textarea.
 * @param {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} el - Form element
 * @param {Object} state - State object
 * @param {string} expr - Bound expression
 * @returns {(value: any) => void} Update function
 */
export default (el, state, expr) => {
  // bind back to value, but some values can be not bindable, eg. `:value="7"`
  try {
    const set = setter(expr)
    const handleChange = el.type === 'checkbox' ? () => set(state, el.checked) :
      el.type === 'select-multiple' ? () => set(state, [...el.selectedOptions].map(o => o.value)) :
        () => set(state, el.selectedIndex < 0 ? null : isNaN(el.valueAsNumber) ? el.value : el.valueAsNumber);

    el.oninput = el.onchange = handleChange; // hope user doesn't redefine these manually via `.oninput = somethingElse` - it saves 5 loc vs addEventListener

    if (el.type?.startsWith('select')) {
      // select element also must observe any added/removed options or changed values (outside of sprae)
      new MutationObserver(handleChange).observe(el, { childList: true, subtree: true, attributes: true });

      // select options must be initialized before calling an update
      sprae(el, state)
    }

    // initial state value - setter has already cached it, so parse is fast
    parse(expr)(state) ?? handleChange()
  } catch { }

  return (el.type === "text" || el.type === "" || el.tagName === "TEXTAREA") ?
    (value, _from, _to) => (
      // we retain selection in input
      (_from = el.selectionStart),
      (_to = el.selectionEnd),
      el.setAttribute("value", (el.value = value == null ? "" : value)),
      _from && el.setSelectionRange(_from, _to)
    ) :
    (el.type === "checkbox") ?
      (value) => (el.checked = value, attr(el, "checked", value)) :
      (el.type === 'radio') ? (value) => (
        el.value === value && ((el.checked = value), attr(el, 'checked', value))
      ) :
        (el.type === "select-one") ?
          (value) => {
            for (let o of el.options)
              o.value == value ? o.setAttribute("selected", '') : o.removeAttribute("selected");
            el.value = value;
          } :
          (el.type === 'select-multiple') ? (value) => {
            for (let o of el.options) o.removeAttribute('selected')
            for (let v of value) el.querySelector(`[value="${v}"]`).setAttribute('selected', '')
          } :
            (value) => (el.value = value);
}
