import { directive, compile } from "../core.js";

directive['data'] = (el, expr, state) => {
  let evaluate = compile(expr, 'data')

  return () => {
    let value = evaluate(state.value)?.valueOf()
    for (let key in value) el.dataset[key] = value[key];
  }
}
