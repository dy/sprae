import { directive, parse } from "../core.js";
import { attr } from './default.js';
import { effect } from "../signal.js";

// connect expr to element value
directive.value = (el, [getValue, setValue], state) => {
  const update =
    (el.type === "text" || el.type === "") ? (value) => el.setAttribute("value", (el.value = value == null ? "" : value))
      : (el.tagName === "TEXTAREA" || el.type === "text" || el.type === "") ? (value, from, to) =>
      (
        // we retain selection in input
        (from = el.selectionStart),
        (to = el.selectionEnd),
        el.setAttribute("value", (el.value = value == null ? "" : value)),
        from && el.setSelectionRange(from, to)
      )
        : (el.type === "checkbox") ? (value) => (el.checked = value, attr(el, "checked", value))
          : (el.type === "select-one") ? (value) => {
            for (let option in el.options) option.removeAttribute("selected");
            el.value = value;
            el.selectedOptions[0]?.setAttribute("selected", "");
          }
            : (value) => (el.value = value);

  // bind back
  const handleChange = el.type === 'checkbox' ? e => setValue(state, el.checked) : e => setValue(state, el.value)
  el.addEventListener('input', handleChange)
  el.addEventListener('change', handleChange)

  return effect(() => (update(getValue(state))));
};

directive.value.parse = expr => {
  let evaluate = [parse(expr)]
  // catch wrong assigns like `123 = arguments[1]`, `foo?.bar = arguments[1]`
  try {
    const set = parse(`${expr}=__;`);
    // FIXME: if there's a simpler way to set value in justin?
    evaluate.push((state, value) => {
      state.__ = value
      let result = set(state, value)
      delete state.__
      return result
    })
  }
  catch (e) { }
  return evaluate
}
