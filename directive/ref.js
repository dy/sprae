import { dir } from "../core.js";
import { setter, ensure } from "../store.js";

dir('ref', (el, state, expr, _, ev) => (
  ensure(state, expr),
  typeof ev(state) == 'function' ?
    v => v.call(null, el) :
    (setter(expr)(state, el), _ => _)
))
