import { dir } from "../core.js";
import { setter, ensure } from "../store.js";

dir('ref', (el, state, expr, _, ev) => (
  ensure(state, expr),
  ev(state) == null ?
    (setter(expr)(state, el), _ => _) :
    v => v.call(null, el)
))
