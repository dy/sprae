import sprae, { directive, parseExpr } from '../core.js'

directive(':with', (el, expr, state) => {
  // it subsprays with shadowed values
  // FIXME: use batch update here
  let substate = sprae(el, Object.create(state))

  return (withValues) => {
    Object.assign(substate, withValues)
  }
})

