import sprae, { directive, compile } from "../core.js";

directive.html = (el, expr, state) => {
  let evaluate = compile(expr, 'html'), tpl = evaluate(state);

  if (!tpl) return

  let content = (tpl.content || tpl).cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);

  return () => el[Symbol.dispose];
};
