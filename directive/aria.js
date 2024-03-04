import { directive, compile } from "../core.js";
import { attr, dashcase } from './default.js'

directive['aria'] = (el, expr, state) => {
  let evaluate = compile(expr, 'aria')
  const update = (value) => {
    for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '');
  }
  return () => {
    update(evaluate(state)?.valueOf())
  }
}
