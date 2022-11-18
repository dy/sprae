import { input, prop } from "element-props";
import { directive, parseExpr } from '../core.js';

// connect expr to element value
directive(':value', (el, expr, state) => {
  let [get, set] = input(el);
  let evaluateSet = parseSetter(expr);
  let onchange = e => evaluateSet(state, get(el));
  // FIXME: double update can be redundant
  el.addEventListener('input', onchange);
  el.addEventListener('change', onchange);
  return (value) => {
    prop(el, 'value', value)
    set(value);
  }
})

const memo = {}
function parseSetter(expr) {
  if (memo[expr]) return memo[expr]
  return memo[expr] = new Function(
    ['scope', 'value'],
    `with (scope) { ${expr} = value };`
  )
}