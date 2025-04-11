import { dir } from "../core.js";
import { untracked } from "../signal.js";
import { setter, ensure } from "../store.js";

dir('ref', (el, state, expr, _, ev) => (
  ensure(state, expr),
  // FIXME: ideally we don't use untracked here, but ev may have internal refs that will subscribe root effect
  untracked(() => typeof ev(state) == 'function') ?
    v => v.call(null, el) :
    (setter(expr)(state, el), _ => _)
))
