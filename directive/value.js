import sprae from "../core.js";
import { directive, parse } from "../core.js";
import { attr } from './default.js';

// connect expr to element value
directive.value = (el, [getValue, setValue], state) => {
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

  // select options must be initialized before calling an update
  if (el.type?.startsWith('select')) sprae(el, state)

  // bind ui back to value
  const handleChange = el.type === 'checkbox' ? e => setValue(state, el.checked) : el.type === 'select-multiple' ? e => setValue(state, [...el.selectedOptions].map(o => o.value)) : e => setValue(state, el.value)

  el.oninput = el.onchange = handleChange; // hope user doesn't redefine these manually - it saves 5 loc

  return () => update(getValue(state));
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
