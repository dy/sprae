import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';

directive.with = (el, evaluate, rootState) => {
  let state
  return () => {
    let values = evaluate(rootState);
    sprae(el, state ? values : state = store(values, rootState))
  }
};
