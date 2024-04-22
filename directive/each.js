import sprae, { directive, swap } from "../core.js";

export const _each = Symbol(":each");

const keys = {}, _key = Symbol('key');

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, [itemVar, idxVar, evaluate], state) => {
  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode("")), parent = tpl.parentNode;
  tpl.replaceWith(holder);

  // key -> el
  const elCache = new WeakMap, stateCache = new WeakMap

  let cur = [];

  const remove = el => {
    el.remove()
    el[Symbol.dispose]?.()
    if (el[_key]) {
      elCache.delete(el[_key])
      stateCache.delete(el[_key])
    }
  }, { insert, replace } = swap

  const options = { remove, insert, replace }

  // naive approach: whenever items change we replace full list
  return () => {
    let items = evaluate(state)?.valueOf(), els = [];

    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i)

    const count = new WeakMap
    for (let idx in items) {
      let el, item = items[idx], key = item?.key ?? item?.id ?? item ?? idx
      key = (Object(key) !== key) ? (keys[key] ||= Object(key)) : item

      if (key == null || count.has(key) || tpl.content) el = (tpl.content || tpl).cloneNode(true)
      else count.set(key, 1), (el = elCache.get(key) || (elCache.set(key, tpl.cloneNode(true)), elCache.get(key)))[_key] = key;

      // creating via prototype is faster in both creation time & reading time
      let substate = stateCache.get(key) || (stateCache.set(key, Object.create(state, { [idxVar]: { value: idx } })), stateCache.get(key));
      substate[itemVar] = item; // can be changed by subsequent updates, need to be writable

      sprae(el, substate);

      // document fragment
      if (el.nodeType === 11) els.push(...el.childNodes); else els.push(el);
    }

    swap(parent, cur, cur = els, holder, options);
  }
}

// redefine parser to exclude `[a in] b`
directive.each.parse = (expr, parse) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "$"] = leftSide.split(/\s*,\s*/);

  return [itemVar, idxVar, parse(itemsExpr)]
}
