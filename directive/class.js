import { directive, compile, ipol } from "../core.js";

directive.class = (el, expr, state) => {
  let evaluate = compile(expr, 'class');
  let initClassName = el.getAttribute("class"); // .className can be SVGAnimatedString da heck
  return () => {
    let v = evaluate(state.value);
    let className = [initClassName];
    if (v) {
      if (typeof v === "string") className.push(ipol(v, state.value));
      else if (Array.isArray(v)) className.push(...v.map(v => ipol(v, state.value)));
    }
    if ((className = className.filter(Boolean).join(" "))) el.setAttribute("class", className);
    else el.removeAttribute("class");
  };
};
