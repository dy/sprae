import sprae, { directive, parse } from "../src/core.js";

directive.html = (el, expr, state) => {
  let evaluate = parse(el, expr, 'html'), tpl = evaluate(state);

  if (!tpl) err(new Error("Template not found"), el, expr, 'html');

  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
  return el[Symbol.dispose];
};
