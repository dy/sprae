import { directive } from '../core.js'
import { parseExpr } from '../eval.js'

// hidden attribute directive example
directive('hidden', (el) => {
  let expr = el.getAttribute(':hidden');
  el.removeAttribute(':hidden');
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    if (value || value === '') el.setAttribute('hidden', '')
    else el.removeAttribute('hidden')
  }
})

