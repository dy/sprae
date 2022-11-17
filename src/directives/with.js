import sprae, { directive, parseExpr } from '../core.js'

directive(':with', (el, expr, rootValues) => {
  let evaluate = parseExpr(expr);

  // it subsprays with shadowed values
  // rootValues get updated by parent directives
  // subscope doesn't contain reactive values
  let subscope = Object.create(rootValues)

  // FIXME: wonder if we better pass initial state rather than values snapshot, to let subtree subscribe to more complete set
  // FIXME: likely initial set can be reactive itself then
  Object.assign(subscope, evaluate(rootValues))
  let [subvalues, subupdate] = sprae(el, subscope)

  return (values) => {
    let withValues = evaluate(values);
    subupdate(withValues)
  }
})

