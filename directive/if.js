import { directive, parse } from "../src/core.js";
import { effect, computed } from '../src/signal.js'

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _else = Symbol("else");
directive.if = (ifEl, expr, state) => {
  let holder = document.createTextNode(""),
    check = parse(ifEl, expr, 'if'),
    cur,
    elseEl = ifEl.nextElementSibling,
    prevPass = ifEl[_else],
    pass = computed(() => check(state));

  ifEl.replaceWith((cur = holder));

  if (elseEl?.hasAttribute(":else")) {
    elseEl.removeAttribute(":else");
    // if next is :else :if - delegate it to own :if handler
    if (elseEl.hasAttribute(":if")) {
      elseEl[_else] = pass;
      elseEl = null;
    } else {
      elseEl.remove();
    }
  } else elseEl = null;

  const dispose = effect(() => {
    const el = prevPass?.value ? holder : pass.value ? ifEl : elseEl;
    if (cur != el) {
      (cur[_each] || cur).replaceWith((cur = el || holder));
      if (cur !== holder) sprae(cur, state);
    }
  });

  return () => {
    ifEl[_dispose]?.();
    elseEl?.[_dispose]?.();
    dispose(); // dispose effect
  };
};
