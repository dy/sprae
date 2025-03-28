import { directive, parse } from "../core.js";

directive.fx = (el, expr, state) => {
  const evaluate = parse(expr)
  return () => evaluate(state);
};
