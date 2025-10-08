import sprae, { store, call, untracked, _state } from '../core.js'

export default (el, rootState, _scope) => (
  // prevent subsequent effects
  el[_state] = null,
  // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
  _scope = store({}, rootState),
  // 1st run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
  // 2nd+ runs update _scope
  values => {
    let ext = call(values, _scope);
    // we bind to _scope to alleviate friction of using scope method directly
    for (let k in ext) _scope[k] = typeof ext[k] === 'function' ? ext[k].bind(_scope) : ext[k];
    // Object.assign(_scope, call(values, _scope))
    return el[_state] ?? (delete el[_state], untracked(() => sprae(el, _scope)))
  }
)
