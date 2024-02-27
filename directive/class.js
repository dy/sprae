import { directive, parse, effect } from "../src/core.js";

directive.class = (el, expr, state) => {
  let evaluate = parse(el, expr, 'class');
  let initClassName = el.getAttribute("class"); // .className can be SVGAnimatedString da heck
  return effect(() => {
    let v = evaluate(state);
    let className = [initClassName];
    if (v) {
      if (typeof v === "string") className.push(v);
      else if (Array.isArray(v)) className.push(...v);
    }
    if ((className = className.filter(Boolean).join(" "))) el.setAttribute("class", className);
    else el.removeAttribute("class");
  });
};
