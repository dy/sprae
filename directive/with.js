import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';

directive.with = (el, evaluate, rootState) => {
  return () => {
    // we need a store with extended signals
    const s = store(evaluate(rootState), Object.create(rootState[_signals]));
    sprae(el, s);
  }
};
