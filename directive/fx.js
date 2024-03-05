import { directive, compile } from "../core.js";

directive.fx = (el, expr, state, name) => {
  let evaluate = compile(expr, name);
  return () => evaluate(state);
};
