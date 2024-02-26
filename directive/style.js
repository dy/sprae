import { directive } from "../src/core.js";

directive.style = (el, expr, state) => {
  let evaluate = parse(el, expr, 'style');
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";")) initStyle += "; ";
  return effect(() => {
    let v = evaluate(state);
    if (typeof v === "string") el.setAttribute("style", initStyle + v);
    else {
      el.setAttribute("style", initStyle);
      for (let k in v) el.style.setProperty(k, v[k]);
    }
  });
};
