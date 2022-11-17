import { directive, parseExpr } from '../core.js'

directive(':with', (el, expr, scope) => {
  let evaluate = parseExpr(expr);

  // assign scope for an element inherited from parent scope
  const rootScope = createScope(el, Object.create(scope));

  return (scope) => {
    let value = evaluate(scope);

    Object.assign(scope, get(scope));

    el.textContent = value == null ? '' : value;
  }
})

