import { directive } from '../core.js'
import { prop } from 'element-props'

directive(':aria', (el) => (value) => {
  for (let key in value) prop(el, 'aria'+key[0].toUpperCase()+key.slice(1), value[key]);
})
