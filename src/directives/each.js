import { directive } from '../core.js'
import { parseExpr } from '../eval.js'

directive(':each', (instance, part) => {
  let evalLoop = part.eval
  part.eval = state => {
    let [itemId, items] = evalLoop(state), list=[]
    // FIXME: cache els instead of recreating. Causes difficulties tracking el children
    for (let item of items) list.push(new TemplateInstance(part.template, {...state,[itemId]:item}, processor))
    return list
  }
})