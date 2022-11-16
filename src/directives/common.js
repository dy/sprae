// common directives just set/map value as is
import { directive, parseExpr } from '../core.js'

common(`id`), common(`name`), common(`for`), common(`type`), common(`hidden`), common(`disabled`), common(`href`), common(`src`)

function common(name) {
  directive(':'+name, (el,expr) => {
    let evaluate = parseExpr(expr)
    return state => {
      let value = evaluate(state);
      if (value === true || value === '') el.setAttribute(name, '');
      else if (value) el.setAttribute(name, value);
      else el.removeAttribute(name)
    }
  })
}