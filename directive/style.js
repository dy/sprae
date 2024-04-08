import { directive, ipol } from "../core.js";

directive.style = (el, evaluate, state) => {
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";")) initStyle += "; ";

  return () => {
    let v = evaluate(state)?.valueOf();
    if (typeof v === "string") el.setAttribute("style", initStyle + ipol(v, state));
    else {
      el.setAttribute("style", initStyle);
      for (let k in v) el.style.setProperty(k, ipol(v[k], state));
    }
  };
};
