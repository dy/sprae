import sprae, { _state } from "../core.js";
import { untracked } from "../signal.js";
import store, { _signals } from '../store.js';

export default (el, rootState, init) => (
  el[_state] = null,
  // NOTE: we force untracked because internal directives can eval outside of effects (like ref etc) that would cause unwanted subscribe
  // FIXME: since this can be async effect, we should create & sprae it in advance.
  values => untracked( () => el[_state] ?
    (sprae(el, values)) :
    (delete el[_state], sprae(el, store(values, rootState)))
  )
)
