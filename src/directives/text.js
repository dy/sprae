import { directive } from '../core.js'
import { parseExpr } from '../eval.js'

// hidden attribute directive example
directive('text', (el) => {
  let expr = el.getAttribute(':text');
  el.removeAttribute(':text');
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    el.textContent = value == null ? '' : value;
  }
})

