import { directive } from "../src/core.js";

// connect expr to element value
directive.value = (el, expr, state) => {
  let evaluate = parse(el, expr, 'value');

  let from, to;
  let update = el.type === "text" || el.type === ""
    ? (value) => el.setAttribute("value", (el.value = value == null ? "" : value))
    : el.tagName === "TEXTAREA" || el.type === "text" || el.type === ""
      ? (value) =>
      (
        // we retain selection in input
        (from = el.selectionStart),
        (to = el.selectionEnd),
        el.setAttribute("value", (el.value = value == null ? "" : value)),
        from && el.setSelectionRange(from, to)
      )
      : el.type === "checkbox"
        ? (value) => ((el.value = value ? "on" : ""), attr(el, "checked", value))
        : el.type === "select-one"
          ? (value) => {
            for (let option in el.options) option.removeAttribute("selected");
            el.value = value;
            el.selectedOptions[0]?.setAttribute("selected", "");
          }
          : (value) => (el.value = value);

  return effect(() => {
    update(evaluate(state));
  });
};
