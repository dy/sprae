import { directive, parse } from "../src/core.js";
import { effect } from '../src/signal.js'

directive['data'] = (el, expr, state) => {
  let evaluate = parse(el, expr, 'data')

  return ((state) => {
    let value = evaluate(state)
    for (let key in value) el.dataset[key] = value[key];
  })
}
