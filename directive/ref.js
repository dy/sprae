import { parse } from "../core.js";
import { setter } from "../store.js";

export default (el, state, expr) => (
  typeof parse(expr)(state) == 'function' ?
    v => v(el) :
    (setter(expr)(state, el), _=>_)
)
