import { dir, parse } from "../core.js";
import { setter, ensure } from "../store.js";

dir('ref', (el, state, expr) => {
  // ensure state has first element of path
  ensure(state, expr)
  // it's ok to call parse separately, since it caches expr
  return parse(expr)(state) == null ?
    (setter(expr)(state, el), _ => _) :
    v => v.call(null, el)
})
