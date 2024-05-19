import sprae, { directive } from "../core.js";
import store, { _signals } from '../store.js';
import { effect } from "../signal.js";
import { signal } from "ulive";

directive.with = (el, evaluate, rootState) => {
  let state
  return effect(() => {
    let values = evaluate(rootState);

    if (!state) {
      state = store({});
      // inherit root signals
      Object.assign(state[_signals], rootState[_signals]);
      // create local scope signals
      for (let key in values) state[_signals][key] = null, state[key] = values[key]

      sprae(el, state)
    }
    else {
      Object.assign(state, values)
    }
  })
};
