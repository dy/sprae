import { directive, parseExpr } from '../core.js'
import { prop } from 'element-props'

directive(':prop', (el, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    for (let key in value) prop(el, key, value[key]);
  }
})
