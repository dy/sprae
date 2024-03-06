import sprae, { directive, compile } from "../core.js";

directive.html = (el, expr, state, name) => {
  let evaluate = compile(expr, name), tpl = evaluate(state);

  if (!tpl) return

  let content = (tpl.content || tpl).cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
};
