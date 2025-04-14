// :<any>="y"

import { attr } from "./all.js"

export default (el, s, e, parts) => value => attr(el, parts[0], value)
