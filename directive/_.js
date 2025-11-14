import { attr, call } from "../core.js";

export default (el, st, ex, name) => v => attr(el, name, v && call(v, el.getAttribute(name)))
