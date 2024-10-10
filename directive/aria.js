import { directive } from "../core.js";
import { attr, dashcase } from './default.js'

directive['aria'] = (el, evaluate, state) => {
  const update = (value) => {
    for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '');
  }
  return () => update(evaluate(state))
}
