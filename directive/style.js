import { directive } from "../core.js";

directive.style = (el, evaluate, state) => {
  let initStyle = el.getAttribute("style");

  return () => {
    let v = evaluate(state);
    if (typeof v === "string") el.setAttribute("style", initStyle + (initStyle.endsWith(';') ? '' : '; ') + v);
    else {
      if (initStyle) el.setAttribute("style", initStyle);
      for (let k in v) k[0] == '-' ? (el.style.setProperty(k, v[k])) : el.style[k] = v[k]
    }
  };
};
