import sprae, { directive, parse } from "../core.js";
import store, { _signals } from '../store.js';

directive.with = (el, expr, rootState) => {
  let state, evaluate = parse(expr)
  return () => {
    let values = evaluate(rootState);
    sprae(el, state ? values : state = store(values, rootState))
  }
};
