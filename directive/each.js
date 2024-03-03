import sprae, { directive, effect, compile, swap, ipol } from "../core.js";

export const _each = Symbol(":each");

const keys = {}; // boxed primitives pool

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, expr, state) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "_$"] = leftSide.split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  const evaluate = compile(itemsExpr, 'each');
  const memo = new WeakMap;

  const getKey = compile(tpl.getAttribute(':key') || idxVar);
  tpl.removeAttribute(':key')

  let cur = [];
  return effect(() => {
    // naive approach: whenever items change we replace full list
    let items = evaluate(state)?.valueOf(), els = [];
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);

    for (let idx in items) {
      let substate = Object.create(state, {
        [itemVar]: { value: items[idx] },
        [idxVar]: { value: idx },
      }),
        key = ipol(getKey(substate), substate);

      // make sure key is object
      if (Object(key) !== key) key = (keys[key] ||= Object(key))

      let el = memo.get(key) || memo.set(key, tpl.cloneNode(true)).get(key)
      // if (els.has(el)) el = el.cloneNode(true) // avoid dupes
      if (el.content) el = el.content.cloneNode(true) // <template>

      sprae(el, substate);

      // document fragment
      if (el.nodeType === 11) els.push(...el.childNodes);
      else els.push(el);
    }

    swap(holder.parentNode, cur, cur = els, holder);
  });
};
