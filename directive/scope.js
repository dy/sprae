import sprae, { store, call, untracked, _state } from '../core.js'

export default (el, rootState, _subscope) => (
  // prevent subsequent effects
  el[_state] = null,
  // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
  _subscope = store({}, rootState),
  // 1st run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
  // 2nd+ runs update _subscope
  values => {
    let ext = call(values, _subscope);
    // we bind to _subscope to alleviate friction using scope method directly
    // also returned props should force-create signals in subscope, not overwriting parent
    for (let k in ext) {
      _subscope[k] = typeof ext[k] === 'function' ? ext[k].bind(_subscope) : ext[k];
    }
    // Object.assign(_subscope, call(values, _subscope))
    return el[_state] ?? (delete el[_state], untracked(() => sprae(el, _subscope)))
  }
)
