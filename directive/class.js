import { clsx, call, decorate } from "../core.js";

export default (el, st, ex, name) => {
  let _cur = new Set, _new

  // redefine target, if modifiers have one
  name.includes('.') && (el = decorate({target:el}, name.split('.').slice(1)).target ?? el)

  return (v) => {
    _new = new Set
    if (v) clsx(call(v, el.className)).split(' ').map(c => c && _new.add(c))
    for (let c of _cur) if (_new.has(c)) _new.delete(c); else el.classList.remove(c);
    for (let c of _cur = _new) el.classList.add(c)
  }
}
