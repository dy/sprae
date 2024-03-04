import { directive, compile, effect } from "../core.js";

directive.fx = (el, expr, state) => {
  let evaluate = compile(expr, 'fx');
  if (evaluate)
    return effect(() => evaluate(state.value));
};
