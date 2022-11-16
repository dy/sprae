import { directive, parseExpr } from '../core.js'

directive(':text', (el, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    el.textContent = value == null ? '' : value;
  }
})

