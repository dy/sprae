import sprae, { directive, compile, swap } from "../core.js";

export const _each = Symbol(":each");

const keys = {}; // boxed primitives pool

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, expr, state, name) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "_$"] = leftSide.split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  const evaluate = compile(itemsExpr, name);
  const memo = new WeakMap;

  tpl.removeAttribute(':key')

  let cur = [];

  return () => {
    // naive approach: whenever items change we replace full list
    let items = evaluate(state)?.valueOf(), els = [];
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);

    const count = new WeakSet
    for (let idx in items) {
      let item = items[idx]
      // creating via prototype is faster in both creation time & reading time
      let substate = Object.create(state, { [idxVar]: { value: idx } });
      substate[itemVar] = item; // can be changed by subsequent updates, need to be writable
      let el, key = (item.key ?? item.id ?? item); // NOTE: no need to unwrap singnal, since item fallback refers to it

      if (key == null) el = tpl.cloneNode(true)
      else {
        // make sure key is object
        if (Object(key) !== key) key = (keys[key] ||= Object(key));

        if (count.has(key)) {
          console.warn('Duplicate key', key), el = tpl.cloneNode(true);
        }
        else {
          count.add(key);
          el = memo.get(key) || memo.set(key, tpl.cloneNode(true)).get(key);
        }
      }

      if (el.content) el = el.content.cloneNode(true) // <template>

      sprae(el, substate)

      // document fragment
      if (el.nodeType === 11) els.push(...el.childNodes);
      else els.push(el);
    }

    swap(holder.parentNode, cur, cur = els, holder);
  };
};
