import { directive, compile, effect } from "../core.js";

// set text content
directive.text = (el, expr, state) => {
  let evaluate = compile(expr, 'text');
  if (el.content) el.replaceWith(el = document.createTextNode('')) // <template :text="abc"/>
  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};
