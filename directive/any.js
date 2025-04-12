// :<any>="y"

import { attr } from "./all.js"

export default (target, state, expr, parts) => value => attr(target, parts[0], value)
