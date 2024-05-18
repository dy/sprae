import { directive } from "../core.js";
import { effect } from "../signal.js";

// set text content
directive.text = (el, evaluate, state) => {
  if (el.content) el.replaceWith(el = document.createTextNode('')) // <template :text="abc"/>

  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};
