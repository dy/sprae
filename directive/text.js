import { directive } from "../core.js";
import { effect } from "../signal.js";
import { tplfrag } from "./each.js";

// set text content
directive.text = (el, evaluate, state) => {
  // take over tpl holder, if persistent fragment passed from each
  if (el.holder) el = el.holder
  // <template :text="abc"/>
  else if (el.content) el.replaceWith(el = document.createTextNode(''))

  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};
