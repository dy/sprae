import { directive, compile, effect } from "../src/core.js";

// set text content
directive.text = (el, expr, state) => {
  let evaluate = compile(expr, 'text');
  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};