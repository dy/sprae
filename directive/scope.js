import { directive, parse } from "../src/core.js";
import { effect } from '../src/signal.js'

// `:each` can redefine scope as `:each="a in {myScope}"`,
// same time per-item scope as `:each="..." :scope="{collapsed:true}"` is useful
directive.scope = (el, expr, rootState) => {
  let evaluate = parse(el, expr, 'scope');
  const localState = evaluate(rootState);
  // we convert all local values to signals, since we may want to update them reactively
  const state = Object.assign(Object.create(rootState), toSignal(localState));
  sprae(el, state);
  return el[_dispose];
};
const toSignal = (state) => {
  for (let key in state) {
    let v = state[key];
    if (Object(v) === v) !v.peek ? toSignal(v) : null;
    else state[key] = signal(v);
  }
  return state;
};
