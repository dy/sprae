import { directive, frag } from "../core.js";
import { effect } from "../signal.js";

// set text content
directive.text = (el, evaluate, state) => {
  // <template :text="a"/> or previously initialized template
  if (el.content) {
    let tplfrag = frag(el)
    if (el !== tplfrag) el.replaceWith(tplfrag.content);
    el = tplfrag.childNodes[0];
  }

  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};
