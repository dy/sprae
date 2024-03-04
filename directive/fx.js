import { directive, compile, effect } from "../core.js";

directive.fx = (el, expr, state) => {
  let evaluate = compile(expr, 'fx');
  let teardown
  return () => (teardown?.call?.(), teardown = evaluate(state));
};
