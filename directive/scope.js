import sprae, { store, untracked, _state, _signals, signal } from '../core.js'

/**
 * Scope directive - creates a child scope with local state.
 * Properties merge into a new scope inheriting from parent.
 * @param {Element} el - Target element
 * @param {Object} rootState - Parent state object
 * @returns {(values: Object | ((state: Object) => Object)) => void | boolean} Update function
 */
export default (el, rootState) => {
  // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
  // el[_state] even replaces own :scope effect state
  let state = el[_state] = store({}, rootState), init = false;

  // 1st run spraes subtree with values from scope, it can be postponed by modifiers (we isolate reads from parent effect)
  // 2nd+ runs update subscope
  return values => {
    values = typeof values === 'function' ? values(state) : values;

    // we bind to subscope to alleviate friction using scope method directly
    // also returned props should force-create signals in subscope, not overwriting parent
    if (values !== state) {
      for (let k in values) {
        // _add forces new prop, instead of checking parent
        let v = typeof values[k] === 'function' ? values[k].bind(state) : values[k]
        // update
        if (k in state[_signals]) state[k] = v
        // create
        else (state[_signals][k] = (k[0] == '_' || v?.peek) ? v : signal(store(v)))
      }
    }

    // Object.assign(subscope, call(values, subscope))
    return !init && (init = true, delete el[_state], untracked(() => sprae(el, state)))
  }
}
