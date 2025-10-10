import { clsx, call } from "../core.js";

export default (el, _cur, _new) => (
  _cur = new Set,
  (v) => {
    _new = new Set
    if (v) clsx(call(v, el.className)).split(' ').map(c => c && _new.add(c))
    for (let c of _cur) if (_new.has(c)) _new.delete(c); else el.classList.remove(c);
    for (let c of _cur = _new) el.classList.add(c)
  }
)
