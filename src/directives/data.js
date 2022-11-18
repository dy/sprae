import { directive, parseExpr } from '../core.js'
import { prop } from 'element-props'

directive(':data', (el) => {
  return (value) => {
    for (let key in value) el.dataset[key] = value[key];
  }
})
