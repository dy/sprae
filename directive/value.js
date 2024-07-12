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
  try {
    evaluate.push(parse(`${expr}=arguments[1];`))
  }
  catch (e) { }
  return evaluate
}
