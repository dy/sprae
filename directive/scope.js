import sprae, { store, untracked, frag, _state, _signals, signal, computed } from '../core.js'
import { _set } from '../store.js'

/**
 * Scope directive - creates a child scope with local state.
 * Properties merge into a new scope inheriting from parent.
 */
export default (el, rootState) => {
  let state = el[_state] = store({}, rootState), init = false

  let holder, _frag = el.content && frag(el)
  if (_frag) el.replaceWith(holder = el.ownerDocument.createTextNode(''))

  return values => {
    values = typeof values === 'function' ? values(state) : values;

    if (values !== state) {
      for (let k in values) {
        let d = Object.getOwnPropertyDescriptor(values, k)
        // getter → computed signal (same pattern as store.js:122-124)
        if (d?.get) { (state[_signals][k] = computed(d.get.bind(state)))[_set] = d.set?.bind(state); continue }
        let v = typeof values[k] === 'function' ? values[k].bind(state) : values[k]
        if (k in state[_signals]) state[k] = v
        else (state[_signals][k] = (k[0] == '_' || v?.peek) ? v : signal(store(v)))
      }
    }

    return !init && (init = true, !holder && (delete el[_state]), untracked(() => (holder?.before(_frag.content || el), sprae(_frag || el, state))))
  }
}
