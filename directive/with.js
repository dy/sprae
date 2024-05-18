import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';
import { effect } from "../signal.js";

directive.with = (el, evaluate, rootState) => {
  let state, values
  return effect(() => {
    values = evaluate(rootState);
    Object.assign(state ||= sprae(el,
      store(
        values,
        Object.create(rootState[_signals])
      )
    ), values)
  })
};
