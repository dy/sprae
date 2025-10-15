import sprae, { store, call, untracked, _state, _signals, signal } from '../core.js'

export default (el, rootState) => {
  // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
  // el[_state] even replaces own :scope effect state
  let subscope = el[_state] = store({}, rootState), init = false;

  // 1st run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
  // 2nd+ runs update subscope
  return values => {
    values = call(values, subscope);

    // we bind to subscope to alleviate friction using scope method directly
    // also returned props should force-create signals in subscope, not overwriting parent
    if (values !== subscope) {
      for (let k in values) {
        // _add forces new prop, instead of checking parent
        let v = typeof values[k] === 'function' ? values[k].bind(subscope) : values[k]
        // update
        if (k in subscope[_signals]) subscope[k] = v
        // create
        else (subscope[_signals][k] = (k[0] == '_' || v?.peek) ? v : signal(store(v)))
      }
    }

    // Object.assign(subscope, call(values, subscope))
    return !init && (init = true, delete el[_state], untracked(() => sprae(el, subscope)))
  }
}
