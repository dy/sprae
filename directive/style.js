import { dir } from "../core.js";

dir('style', (el, initStyle) => (
  initStyle = el.getAttribute("style"),
  v => {
    if (typeof v === "string") el.setAttribute("style", initStyle + (initStyle.endsWith(';') ? '' : '; ') + v);
    else {
      if (initStyle) el.setAttribute("style", initStyle);
      for (let k in v) k[0] == '-' ? (el.style.setProperty(k, v[k])) : el.style[k] = v[k]
    }
  })
)
