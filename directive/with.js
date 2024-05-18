import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';
import { effect } from "../signal.js";

directive.with = (el, evaluate, rootState) => {
  const state = sprae(el,
    store(
      evaluate(rootState),
      Object.create(rootState[_signals])
    )
  );
  return effect(() => Object.assign(state, evaluate(rootState)))
};
