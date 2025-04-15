import sprae, { dir, _state, _on, _off, frag } from "../core.js";

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
const _prevIf = Symbol("if");

dir('if', (el, state) => {
  let holder = document.createTextNode('')

  let nextEl = el.nextElementSibling,
    curEl, ifEl, elseEl;

  el.replaceWith(holder)

  ifEl = el.content ? frag(el) : el
  ifEl[_state] = null // mark el as fake-spraed to hold-on init, since we sprae rest when branch matches

  // FIXME: instead of nextEl / el we should use elseEl / ifEl
  if (nextEl?.hasAttribute(":else")) {
    nextEl.removeAttribute(":else");
    // if nextEl is :else :if - leave it for its own :if handler
    if (!nextEl.hasAttribute(":if")) nextEl.remove(), elseEl = nextEl.content ? frag(nextEl) : nextEl, elseEl[_state] = null
  }
  else nextEl = null

  return (value, newEl = el[_prevIf] ? null : value ? ifEl : elseEl) => {
    if (nextEl) nextEl[_prevIf] = el[_prevIf] || newEl == ifEl
    if (curEl != newEl) {
      // disable effects on child elements when element is not matched
      if (curEl) curEl.remove(), curEl[_off]?.();
      if (curEl = newEl) {
        holder.before(curEl.content || curEl)
        // remove fake memo to sprae as new
        curEl[_state] === null ? (delete curEl[_state], sprae(curEl, state))
        // enable effects if branch is matched
        : curEl[_on]()
      }
    }
  };
})
