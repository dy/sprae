import { directive, compile, effect } from "../core.js";
import { attr, dashcase } from './default.js'

directive['aria'] = (el, expr) => {
  let evaluate = compile(expr, 'aria')
  const update = (value) => {
    for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '');
  }
  return effect((state) => {
    update(evaluate(state)?.valueOf())
  })
}
