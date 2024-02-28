import swapdom from "swapdom/swap-inflate.js";
import sprae, { directive, compile, effect } from "../src/core.js";

export const _each = Symbol(":each");

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, expr, state) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = ""] = leftSide.split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  const evaluate = compile(itemsExpr, 'each');

  let cur = [];
  return effect(() => {
    // naive approach: whenever items change we replace full list
    let items = evaluate(state), els = [];
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);

    // FIXME: keep prev items (avoid reinit)
    // FIXME: nadi fail here without untracked
    // untracked(() => {
    for (let idx in items) {
      let el = tpl.cloneNode(true),
        substate = Object.create(state, {
          [itemVar]: { value: items[idx] },
          [idxVar]: { value: idx },
        });
      sprae(el, substate);
      els.push(el);
    }
    // })

    swapdom(holder.parentNode, cur, els, holder);
    cur = els;
  });
};
