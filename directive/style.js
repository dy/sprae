import { call, attr } from "../core.js";

export default (_el, _static, _st, _n, {target:el}) => (
  _static = el.getAttribute("style"),
  v => {
    v = call(v, el.style)
    if (typeof v === "string") attr(el, "style", _static + '; ' + v);
    else {
      if (_static) attr(el, "style", _static);
      // NOTE: we skip names not starting with a letter - eg. el.style stores properties as { 0: --x } or JSDOM has _pfx
      for (let k in v) k[0] == '-' ? el.style.setProperty(k, v[k]) : k[0] > 'A' && (el.style[k] = v[k])
    }
  }
)
