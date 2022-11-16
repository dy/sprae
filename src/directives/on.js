import { directive, parseExpr } from '../core.js'

directive(':on', (el, expr) => {
  let evaluate = parseExpr(expr);
  let listeners = {}
  return (state) => {
    for (let evt in listeners) el.removeEventListener(evt, listeners[evt]);
    listeners = evaluate(state);
    for (let evt in listeners) el.addEventListener(evt, listeners[evt]);
  }
})

