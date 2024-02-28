import sprae, { directive, compile } from "../src/core.js";

directive.html = (el, expr, state) => {
  let evaluate = compile(expr, 'html'), tpl = evaluate(state);

  if (!tpl) err(new Error("Template not found"), el, expr, 'html');

  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
  return el[Symbol.dispose];
};
