import { dir } from "../core.js";

dir('ref', (el, state, expr) => (
  v => v.call(null, el)
))
