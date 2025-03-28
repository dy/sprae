import { dir } from "../core.js";
import { attr, dashcase } from './default.js'

dir('aria', (el) => value => {
  for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '')
})
