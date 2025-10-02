import { attr, call } from "../core.js";

export default (el, st, ex, name) => v => attr(el, name, call(v, el.getAttribute(name)))
