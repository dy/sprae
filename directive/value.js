import sprae from "../core.js";
import { dir, parse } from "../core.js";
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

  // bind ui back to value
  let set = setter(expr)
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

  return update
})

// create expression setter, reflecting value back to state
export const setter = expr => {
  // catch wrong assigns like `123 =...`, `foo?.bar =...`
  try {
    const set = parse(`${expr}=__`);
    // FIXME: if there's a simpler way to set value in justin?
    return (state, value) => {
      state.__ = value
      set(state, value)
      delete state.__
    }
  }
  catch (e) { }
}
