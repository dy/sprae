import sprae, { directive } from "../core.js";

directive.html = (el, evaluate, state) => {
  let tpl = evaluate(state);

  if (!tpl) return

  let content = (tpl.content || tpl).cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
};
