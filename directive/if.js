import sprae, { directive, memo, frag } from "../core.js";
import { effect } from "../signal.js";

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
const _prevIf = Symbol("if");
directive.if = (el, evaluate, state) => {
  let next = el.nextElementSibling,
    holder = document.createTextNode(''),

    // actual replaceable els (takes <template>)
    cur, _if, _else;

  el.replaceWith(holder)

  _if = el.content ? frag(el) : el

  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    // if next is :else :if - leave it for its own :if handler
    if (!next.hasAttribute(":if")) next.remove(), _else = next.content ? frag(next) : next;
  }

  // we mark all els as fake-spraed, because we have to sprae for real on insert
  memo.set(_if, null)
  if (_else) memo.set(_else, null)

  return effect(() => {
    const newEl = evaluate(state) ? _if : el[_prevIf] ? null : _else;
    if (next) next[_prevIf] = newEl === _if
    if (cur != newEl) {
      cur?.remove()
      if (cur = newEl) {
        holder.before(cur.content || cur)
        memo.get(cur) === null && memo.delete(cur) // remove fake memo to sprae as new
        sprae(cur, state)
      }
    }
  });
};
