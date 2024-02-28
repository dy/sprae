import swap from "swapdom";
import sprae, { directive, effect, computed } from "../core.js";
import { _each } from './each.js'

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _prevIf = Symbol("if");
directive.if = (ifEl, expr, state) => {
  let parent = ifEl.parentNode,
    next = ifEl.nextElementSibling,
    holder = document.createTextNode(''),

    evaluate = sprae.compile(expr, 'if'),
    prevPass = ifEl[_prevIf],
    pass = computed(() => evaluate(state)),

    // actual replaceable els (takes <template>)
    cur, ifs, elses;

  ifEl.after(holder) // mark end of modifying section

  if (ifEl.content) cur = [], ifEl.remove(), ifs = [...ifEl.content.childNodes]
  else ifs = cur = [ifEl]

  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    // if next is :else :if - leave it for its own :if handler
    if (next.hasAttribute(":if")) elses = [], next[_prevIf] = pass;
    else next.remove(), elses = next.content ? [...next.content.childNodes] : [next];
  } else elses = []

  const dispose = effect(() => {
    const newEls = prevPass?.value ? [] : pass.value ? ifs : elses;
    if (cur != newEls) {
      // FIXME: :if :each fails here
      // (cur[_each] || cur).replaceWith(cur = el);
      // console.log(cur, newEls)
      swap(parent, cur, cur = newEls, holder);
      for (let el of cur) sprae(el, state);
    }
  });

  return () => {
    ifEl[Symbol.dispose]?.();
    elseEl?.[Symbol.dispose]?.();
    dispose(); // dispose effect
  };
};
