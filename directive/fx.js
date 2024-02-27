import { directive, parse, effect } from "../src/core.js";

directive.fx = (el, expr, state) => {
  let evaluate = parse(el, expr, 'fx');
  if (evaluate)
    return effect(() => {
      evaluate(state);
    });
};
