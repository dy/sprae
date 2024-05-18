import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';
import { effect } from "../signal.js";

directive.with = (el, evaluate, rootState) => {
  return effect(() => {
    // we need a store with extended signals
    // FIXME: state has to be created once and only updated after
    const s = store(evaluate(rootState), Object.create(rootState[_signals]));
    sprae(el, s);
  })
};
