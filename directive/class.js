import { directive, compile, effect, ipol } from "../core.js";

directive.class = (el, expr, state) => {
  let evaluate = compile(expr, 'class');
  let initClassName = el.getAttribute("class"); // .className can be SVGAnimatedString da heck
  return effect(() => {
    let v = evaluate(state);
    let className = [initClassName];
    if (v) {
      if (typeof v === "string") className.push(ipol(v, state));
      else if (Array.isArray(v)) className.push(...v.map(v => ipol(v, state)));
    }
    if ((className = className.filter(Boolean).join(" "))) el.setAttribute("class", className);
    else el.removeAttribute("class");
  });
};
