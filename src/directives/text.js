import { directive, parseExpr } from '../core.js'

directive(':text', (el) => {
  return (value) => {
    el.textContent = value == null ? '' : value;
  }
})

