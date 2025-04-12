import { parse } from "../core.js";
import { setter } from "../store.js";

export default (el, state, expr) => (
  // FIXME: ideally we don't use untracked here, but ev may have internal refs that will subscribe root effect
  typeof parse(expr)(state) == 'function' ?
    v => v.call(null, el) :
    (setter(expr)(state, el), _ => _)
)
