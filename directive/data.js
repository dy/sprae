import { directive, parse, effect } from "../src/core.js";

directive['data'] = (el, expr, state) => {
  let evaluate = parse(el, expr, 'data')

  return ((state) => {
    let value = evaluate(state)
    for (let key in value) el.dataset[key] = value[key];
  })
}
