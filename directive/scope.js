import sprae, { directive, compile } from "../core.js";

// `:each` can redefine scope as `:each="a in {myScope}"`,
// same time per-item scope as `:each="..." :scope="{collapsed:true}"` is useful
directive.scope = (el, expr, rootState) => {
  let evaluate = compile(expr, 'scope');
  // local state may contain signals that update, so we take them over
  const dispose = () => el[Symbol.dispose]?.()
  return () => {
    sprae(el, { ...rootState, ...(evaluate(rootState)?.valueOf?.() || {}) });
    return dispose
  }
};
