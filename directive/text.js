import { directive, frag, parse } from "../core.js";

// set text content
directive.text = (el, expr, state) => {
  const evaluate = parse(expr)
  // <template :text="a"/> or previously initialized template
  if (el.content) el.replaceWith(el = frag(el).childNodes[0])

  return () => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  };
};
