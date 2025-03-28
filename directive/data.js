import { directive, parse } from "../core.js";

directive['data'] = (el, expr, state) => {
  const evaluate = parse(expr)
  return () => {
    let value = evaluate(state)
    for (let key in value) el.dataset[key] = value[key];
  }
}
