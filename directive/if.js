import sprae, { compile, computed, directive, effect, untracked, swap, _version } from "../core.js";
import { _each } from './each.js';

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _prevIf = Symbol("if");
directive.if = (ifEl, expr, state) => {
  let parent = ifEl.parentNode,
    next = ifEl.nextElementSibling,
    holder = document.createTextNode(''),

    evaluate = compile(expr, 'if'),
    prevPass = ifEl[_prevIf],
    pass = computed(() => (state[_version].value, evaluate(state)?.valueOf())),

    // actual replaceable els (takes <template>)
    cur, ifs, elses, none = [];

  ifEl.after(holder) // mark end of modifying section

  if (ifEl.content) cur = none, ifEl.remove(), ifs = [...ifEl.content.childNodes]
  else ifs = cur = [ifEl]

  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    // if next is :else :if - leave it for its own :if handler
    if (next.hasAttribute(":if")) elses = none, next[_prevIf] = pass;
    else next.remove(), elses = next.content ? [...next.content.childNodes] : [next];
  } else elses = none

  const dispose = () => {
    for (let el of ifs) el[Symbol.dispose]?.()
    for (let el of elses) el[Symbol.dispose]?.()
  }

  return () => {
    const newEls = prevPass?.value ? none : pass.value ? ifs : elses;
    if (cur != newEls) {
      // :if :each
      if (cur[0]?.[_each]) cur = [cur[0][_each]]
      swap(parent, cur, cur = newEls, holder);
      for (let el of cur) sprae(el, state);
    }
    return dispose
  };
};
