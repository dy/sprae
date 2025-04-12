// :aria="{...}"

import { attr, dashcase } from './all.js'

export default (el) => value => {
  for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '')
}
