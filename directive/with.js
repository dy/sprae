import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';
import { effect } from "../signal.js";

directive.with = (el, evaluate, rootState) => {
  let state
  return effect(() => {
    let values = evaluate(rootState);
    sprae(el, state ? values : state = store(values, rootState))
  })
};
