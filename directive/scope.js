import sprae, { store, call, untracked, _state } from '../core.js'

export default (el, rootState, _scope) => (
  // prevent subsequent effects
  el[_state] = null,
  // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
  _scope = store({}, rootState),
  // 1st run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
  // 2nd+ runs update _scope
  values => (Object.assign(_scope, call(values, _scope)), el[_state] ?? (delete el[_state], untracked(() => sprae(el, _scope))))
)
