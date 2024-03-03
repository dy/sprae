import sprae, { directive, effect, compile, swap } from "../core.js";

export const _each = Symbol(":each");

const keys = {}; // boxed primitives pool

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, expr, state) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = ""] = leftSide.split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  const evaluate = compile(itemsExpr, 'each');
  const memo = new WeakMap;

  let cur = [];
  return effect(() => {
    // naive approach: whenever items change we replace full list
    let items = evaluate(state)?.valueOf(), els = new Set;
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);

    const getKey = (i) => (Object(i) !== i) ? (keys[i] ||= Object(i)) : i

    for (let idx in items) {
      let item = items[idx], key, substate;

      // key is either item.id / item itself for non-primitive case, item itself otherwise
      key = getKey(item?.id ?? item);

      let el = memo.get(key) || memo.set(key, tpl.cloneNode(true)).get(key)
      if (els.has(el)) el = el.cloneNode(true) // avoid dupes
      if (el.content) el = el.content.cloneNode(true) // <template>

      substate = Object.create(state, {
        [itemVar]: { value: items[idx] },
        [idxVar]: { value: idx },
      });
      sprae(el, substate);

      // document fragment
      if (el.nodeType === 11) [...el.childNodes].map(el => els.add(el));
      else els.add(el);
    }

    swap(holder.parentNode, cur, cur = [...els], holder);
  });
};
