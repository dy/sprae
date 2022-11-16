import { input, prop } from "element-props";
import { directive, parseExpr } from '../core.js';

// connect expr to element value
directive(':value', (el, expr) => {
  let evaluateGet = parseExpr(expr);
  let [get, set] = input(el);
  let evaluateSet = parseSetter(expr);
  let curState, onchange = e => evaluateSet(curState, get(el));
  el.addEventListener('input', onchange);
  el.addEventListener('change', onchange);
  return (state) => {
    let value = evaluateGet(curState = state);
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