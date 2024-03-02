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

  // <template>
  if (tpl.content) tpl = tpl.content

  const evaluate = compile(itemsExpr, 'each');
  const memo = new WeakMap;

  let cur = [];
  return effect(() => {
    // naive approach: whenever items change we replace full list
    let items = evaluate(state), els = [];
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);

    const count = {}
    for (let idx in items) {
      let item = items[idx], _,
        // key is either item.id / item itself for non-primitive case,
        key = Object(item) === item ? item?.id ?? item :
          // item itself by number for primitive cases
          keys[_ = item + '-' + (count[item] = (count[item] || 0) + 1)] ||= Object(_);

      let el = memo.get(key) || memo.set(key, tpl.cloneNode(true)).get(key),
        substate = Object.create(state, {
          [itemVar]: { value: items[idx] },
          [idxVar]: { value: idx },
        });
      sprae(el, substate);

      // document fragment
      el.nodeType === 11 ? els.push(...el.childNodes) : els.push(el);
    }

    swap(holder.parentNode, cur, els, holder);
    cur = els;
  });
};
