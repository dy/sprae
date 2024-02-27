import sprae, { directive, parse } from "../src/core.js";

// `:each` can redefine scope as `:each="a in {myScope}"`,
// same time per-item scope as `:each="..." :scope="{collapsed:true}"` is useful
directive.scope = (el, expr, rootState) => {
  let evaluate = parse(el, expr, 'scope');
  const localState = evaluate(rootState);
  // we convert all local values to signals, since we may want to update them reactively
  const state = Object.assign(Object.create(rootState), localState);
  sprae(el, state);
  return el[Symbol.dispose];
};
