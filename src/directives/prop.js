import { directive, parseExpr } from '../core.js'
import { prop } from 'element-props'

directive(':prop', (el) => {
  return (value) => {
    if (!value) return
    for (let key in value) prop(el, key, value[key]);
  }
})
