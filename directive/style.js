import { call, attr, decorate } from "../core.js";

export default (el, st, ex, name) => {
  let _static;

  // redefine target, if modifiers have one
  if (name.includes('.')) el = decorate({target:el}, name.split('.').slice(1)).target ?? el;

  return v => {
    if (!_static) { _static = el.getAttribute("style") }
    if (v) v = call(v, el.style)
    if (typeof v === "string") attr(el, "style", _static + '; ' + v);
    else {
      if (_static) attr(el, "style", _static);
      // NOTE: we skip names not starting with a letter - eg. el.style stores properties as { 0: --x } or JSDOM has _pfx
      for (let k in v) k[0] == '-' ? el.style.setProperty(k, v[k]) : k[0] > 'A' && (el.style[k] = v[k])
    }
  }
}
