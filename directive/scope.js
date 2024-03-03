import sprae, { directive, compile, effect } from "../core.js";

// `:each` can redefine scope as `:each="a in {myScope}"`,
// same time per-item scope as `:each="..." :scope="{collapsed:true}"` is useful
directive.scope = (el, expr, rootState) => {
  let evaluate = compile(expr, 'scope');
  let state = Object.create(rootState)
  // local state may contain signals that update, so we take them over
  const dispose = effect(() => {
    state = Object.assign(state, evaluate(rootState)?.valueOf?.() || {});
    sprae(el, state);
  })
  return () => (el[Symbol.dispose]?.(), dispose());
};
