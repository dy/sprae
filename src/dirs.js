import { directive } from './core.js'
import { parseExpr } from './eval.js'

// hidden attribute directive example
directive('hidden', (el, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    if (value || value === '') el.setAttribute('hidden', '')
    else el.removeAttribute('hidden')
  }
})


// directive(':if', (el, expr, stash) => {
//   stasj
//   let stash = {els: [el], clauses:[parse(expr)], holder:new Text}, current = el
//   ifStash.set(el, stash)
//   return state => {
//     let idx = stash.clauses.findIndex(match => match(state))
//     if (idx >= 0) current.replaceWith(current = els[idx])
//     else current.replaceWith(current = holder)
//   }
// })
// directive(':else-if', (el, expr) => {
//   const ifNode = prev('text-with-if')
//   const stash = ifStash.get(ifNode)
//   stash.els.push(el)
//   stash.els.
//   return
// })
// directive(':else', (el, expr) => {

// })

// directive(':each', (instance, part) => {
//   let evalLoop = part.eval
//   part.eval = state => {
//     let [itemId, items] = evalLoop(state), list=[]
//     // FIXME: cache els instead of recreating. Causes difficulties tracking el children
//     for (let item of items) list.push(new TemplateInstance(part.template, {...state,[itemId]:item}, processor))
//     return list
//   }
// })