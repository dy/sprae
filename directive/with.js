import sprae, { dir } from "../core.js";
import { untracked } from "../signal.js";
import store, { _signals } from '../store.js';

dir('with', (el, rootState, state) => (
  state=null,
  values => !state ?
    // NOTE: we force untracked because internal directives can eval outside of effects (like ref etc) that would cause unwanted subscribe
    // FIXME: since this can be async effect, we should create & sprae it in advance.
    untracked(() => sprae(el, state = store(values, rootState))) :
    sprae(el, values)
))
