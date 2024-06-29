import sprae, { directive, memo, frag } from "../core.js";
import { effect } from "../signal.js";

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
const _prevIf = Symbol("if");
directive.if = (ifEl, evaluate, state) => {
  let next = ifEl.nextElementSibling,
    holder = document.createTextNode(''),

    // actual replaceable els (takes <template>)
    none = [], cur = none, ifs, elses;

  ifEl.replaceWith(holder)

  ifs = ifEl.content ? [frag(ifEl)] : [ifEl]

  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    // if next is :else :if - leave it for its own :if handler
    if (next.hasAttribute(":if")) elses = none;
    else next.remove(), elses = next.content ? [frag(next)] : [next];
  } else elses = none;

  // we mark all els as fake-spraed, because we have to sprae for real on insert
  for (let el of [...ifs, ...elses]) memo.set(el, null)

  return effect(() => {
    const newEls = evaluate(state) ? ifs : ifEl[_prevIf] ? none : elses;
    if (next) next[_prevIf] = newEls === ifs
    if (cur != newEls) {
      for (let el of cur) el.remove();
      cur = newEls;
      for (let el of cur) {
        holder.before(el.content || el)
        memo.get(el) === null && memo.delete(el) // remove fake memo to sprae as new
        sprae(el, state)
      }
    }
  });
};
