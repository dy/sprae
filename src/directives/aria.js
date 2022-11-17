import { directive, parseExpr } from '../core.js'
import { prop } from 'element-props'

directive(':aria', (el, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    for (let key in value) prop(el, 'aria'+key[0].toUpperCase()+key.slice(1), value[key]);
  }
})
