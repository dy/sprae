import sprae, { directive } from "../core.js";
import { _each } from './each.js';

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
const _prevIf = Symbol("if");
directive.if = (ifEl, evaluate, state) => {
  let parent = ifEl.parentNode,
    next = ifEl.nextElementSibling,
    holder = document.createTextNode(''),

    // actual replaceable els (takes <template>)
    cur, ifs, elses, none = [];

  ifEl.after(holder) // mark end of modifying section

  if (ifEl.content) cur = none, ifEl.remove(), ifs = [...ifEl.content.childNodes]
  else ifs = cur = [ifEl]

  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    // if next is :else :if - leave it for its own :if handler
    if (next.hasAttribute(":if")) elses = none;
    else next.remove(), elses = next.content ? [...next.content.childNodes] : [next];
  } else elses = none

  return () => {
    const newEls = evaluate(state) ? ifs : ifEl[_prevIf] ? none : elses;
    if (next) next[_prevIf] = newEls === ifs
    if (cur != newEls) {
      // :if :each
      if (cur[0]?.[_each]) cur = [cur[0][_each]]
      for (let el of cur) el.remove();
      cur = newEls;
      for (let el of cur) parent.insertBefore(el, holder), sprae(el, state);
    }
  };
};
