import sprae, { directive, _state, frag } from "../core.js";

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
const _prevIf = Symbol("if");
directive.if = (el, evaluate, state) => {
  let next = el.nextElementSibling,
    holder = document.createTextNode(''),
    curEl, ifEl, elseEl;

  el.replaceWith(holder)

  ifEl = el.content ? frag(el) : el
  ifEl[_state] = null // mark el as fake-spraed to holdon init, since we sprae rest when branch matches

  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    // if next is :else :if - leave it for its own :if handler
    if (!next.hasAttribute(":if")) next.remove(), elseEl = next.content ? frag(next) : next, elseEl[_state] = null
  }

  return () => {
    const newEl = evaluate(state) ? ifEl : el[_prevIf] ? null : elseEl;
    if (next) next[_prevIf] = newEl === ifEl
    if (curEl != newEl) {
      // disable effects on child elements to avoid internal effects from triggering on value changes when element's not matched
      if (curEl) curEl.remove(), curEl[Symbol.dispose]?.();
      if (curEl = newEl) {
        holder.before(curEl.content || curEl)
        curEl[_state] === null && delete curEl[_state] // remove fake memo to sprae as new
        sprae(curEl, state)
      }
    }
  };
};
