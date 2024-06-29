import { directive, frag } from "../core.js";
import { effect } from "../signal.js";

// set text content
directive.text = (el, evaluate, state) => {
  // <template :text="a"/> or previously initialized template
  if (el.content) el.replaceWith((el = frag(el)).content);

  return effect(() => {
    let value = evaluate(state);
    (el._ || el).textContent = value == null ? "" : value;
  });
};
