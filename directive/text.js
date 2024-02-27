import { directive, parse } from "../src/core.js";
import { effect } from '../src/signal.js'

// set text content
directive.text = (el, expr, state) => {
  let evaluate = parse(el, expr, 'text');
  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};
