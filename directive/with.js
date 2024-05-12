import sprae, { directive } from "../core.js";
import store from '../store.js';

// `:each` can redefine scope as `:each="a in myScope"`,
// same time per-item scope as `:each="..." :with="{collapsed:true}"` is useful
directive.with = (el, evaluate, rootState) => {
  // local state may contain signals that update, so we take them over
  return () => {
    // no-store version: would subscribe to all store props
    // or ignore signals from the root state
    // sprae(el, { ...rootState, ...(evaluate(rootState)?.valueOf?.() || {}) });

    // so we need a store with extended signals
    // FIXME: inherit signals here instead and make store constructor simpler
    sprae(el, store(evaluate(rootState), rootState));

    // sprae(el,)
  }
};
