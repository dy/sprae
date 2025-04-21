import sprae, { _state, attr } from "../core.js";
import store from '../store.js';

// :scope creates variables scope for a subtree
export default (el, rootState, expr) => {
  // :scope="expr" -> :scope :with="expr"
  // we need effect to be run within new scope
  expr && attr(el, sprae.prefix + 'with', expr),
  sprae(el, store({}, rootState)),
  null
}
