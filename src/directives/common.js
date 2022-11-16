// common directives just set/map value as is
import { directive, parseExpr } from '../core.js'

// modified element-props/prop
export const prop = (el, k, v) => (
  el[k] !== v && (el[k] = v),
  v === false || v == null ? el.removeAttribute(k) :
  typeof v !== 'function' && el.setAttribute(k,
    v === true ? '' :
    typeof v === 'number' || typeof v === 'string' ? v :
    k === 'class' ? (Array.isArray(v) ? v : Object.keys(v).map(k=>v[k]?k:'')).filter(Boolean).join(' ') :
    k === 'style' && v.constructor === Object ? (k=v, v=Object.values(v), Object.keys(k).map((k,i) => `${k}: ${v[i]};`).join(' ')) : ''
  )
)

common(`id`), common(`name`), common(`for`), common(`type`), common(`hidden`), common(`disabled`), common(`href`), common(`src`), common(`style`), common(`class`)

function common(name) {
  directive(':'+name, (el,expr) => {
    let evaluate = parseExpr(expr)
    return state => {
      let value = evaluate(state);
      prop(el, name, value)
    }
  })
}