import sprae, { directive, compile, swap } from "../core.js";

// configure disposal on remove
swap.remove = (el) => {
  el.remove()
  el[Symbol.dispose]?.()
}

export const _each = Symbol(":each");

const keys = {}; // boxed primitives pool

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, expr, state, name) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "_$"] = leftSide.split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  const parent = tpl.parentNode;
  tpl.replaceWith(holder);

  const memo = new WeakMap;

  const evaluate = compile(itemsExpr, name);

  let cur = [];

  // naive approach: whenever items change we replace full list
  return () => {
    let items = evaluate(state)?.valueOf(), els = [];

    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);
    // let c = 0, inc = () => { if (c++ > 100) throw 'Inf recursion' }

    const count = new WeakSet
    for (let idx in items) {
      let item = items[idx]
      // creating via prototype is faster in both creation time & reading time
      let substate = Object.create(state, { [idxVar]: { value: idx } });
      substate[itemVar] = item; // can be changed by subsequent updates, need to be writable
      let el, key = (item?.key ?? item?.id ?? item); // NOTE: no need to unwrap singnal, since item fallback covers it

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

    swap(parent, cur, cur = els, holder);

    /*
    // modified swapdom/deflate.obj
    // premise: to update individual items, make them signals;
    // here we just rearrange list, not updating individual items
    let cur, i = 0, k, c, el, item, substate, next, itemKeys = Object.keys(items)

    // get key of an item (for objects that's just key, for arrays it's heuristic)
    const key = Array.isArray(items) ?
      (k, item) => (
        item = items[k], item = (item?.key ?? item?.id ?? item ?? k), Object(item) !== item ? keys[item] ||= Object(item) : item
      ) :
      k => keys[k] ||= Object(k)

    // build new index
    for (i in items) {
      k = key(i)
      if (newIdx.has(k)) console.warn(`∴ Duplicate index`, k)
      newIdx.set(k, (newIdx.get(k) || 0) + 1)
    }

    // remove elements
    for ([k, i] of idx) {
      newIdx.has(k) ? cur ||= els.get(k) : (
        el = els.get(k),
        el.remove(), els.delete(k),
        el[Symbol.dispose]()
      )
    }
    cur ||= holder

    // then add needed
    while (i = itemKeys.shift()) {
      item = items[i], k = key(i), el = els.get(k), next = cur?.nextSibling || holder

      // skip
      if (cur === el) cur = next, substate = {}

      // move/add
      else {
        // swap 1:1 (saves costly swaps)
        if (els.get(key(itemKeys[0])) === next) cur = next

        // just move item
        if (el) { substate = {}; }
        // create item
        else {
          el = tpl.cloneNode(true)
          substate = Object.create(state, { [idxVar]: { value: i } });
          els.set(k, el);
        }
        parent.insertBefore(el, cur);
      }

      // we update each item since it could've been changed...
      substate[itemVar] = item;
      sprae(el, substate);
    }
    idx = newIdx
    */
  };
};
