import sprae, { parse } from "../core.js";
import { dir } from "../core.js";
import { untracked } from "../signal.js";
import { setter } from "../store.js";
import { attr } from './default.js';


dir('value', (el, state, expr) => {
  const update =
    (el.type === "text" || el.type === "") ?
      (value) => el.setAttribute("value", (el.value = value == null ? "" : value)) :
      (el.tagName === "TEXTAREA" || el.type === "text" || el.type === "") ?
        (value, from, to) => (
          // we retain selection in input
          (from = el.selectionStart),
          (to = el.selectionEnd),
          el.setAttribute("value", (el.value = value == null ? "" : value)),
          from && el.setSelectionRange(from, to)
        ) :
        (el.type === "checkbox") ?
          (value) => (el.checked = value, attr(el, "checked", value)) :
          el.type === 'radio' ? (value) => (
            el.value === value && ((el.checked = value), attr(el, 'checked', value)),
            el.checked && (el.value = value)
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

  // bind back to value, but some values can be not bindable, eg. `:value="7"`
  try {
    const set = setter(expr)
    const handleChange = el.type === 'checkbox' ? () => set(state, el.checked) :
      el.type === 'select-multiple' ? () => set(state, [...el.selectedOptions].map(o => o.value)) :
        () => set(state, el.selectedIndex < 0 ? null : el.value)

    el.oninput = el.onchange = handleChange; // hope user doesn't redefine these manually via `.oninput = somethingElse` - it saves 5 loc vs addEventListener

    if (el.type?.startsWith('select')) {
      // select element also must observe any added/removed options or changed values (outside of sprae)
      new MutationObserver(handleChange).observe(el, { childList: true, subtree: true, attributes: true });

      // select options must be initialized before calling an update
      sprae(el, state)
    }

    // initial state value
    parse(expr)(state) ?? handleChange()
  } catch {}

  return update
})
