import { attr } from "../core.js";

export default (el, st, ex, name) => v => attr(el, name, typeof v === 'function' ? v(el.getAttribute(name)) : v)
