import genericDirective, { directive } from "./directives.js";
import * as signals from './signal.js'
// import * as signals from '@webreflection/signal'
// import * as signals from '@preact/signals-core'

export const _dispose = (Symbol.dispose ||= Symbol("dispose"));

// sprae element: apply directives
const memo = new WeakMap();

export default function sprae(container, values) {
  // repeated call can be caused by :each with new objects with old keys needs an update
  if (memo.has(container))
    return batch(() => Object.assign(memo.get(container), values));

  // take over existing state instead of creating clone
  const state = values || {};
  const disposes = [];

  // init directives on element
  const init = (el, parent = el.parentNode) => {
    const { attributes } = el
    if (attributes) {
      // init registered directives first
      for (let name in directive) {
        let attr = attributes[':' + name]
        if (attr) {
          el.removeAttribute(attr.name);
          disposes.push(directive[name](el, attr.value, state, name));

          // stop if element was spraed by directive or skipped (detached) like in case of :if or :each
          if (memo.has(el)) return;
          if (el.parentNode !== parent) return false;
        }
      }

      // init generic-name attributes second
      for (let i = 0; i < attributes.length;) {
        let attr = attributes[i], prefix = attr.name[0];

        if (prefix === ":") {
          el.removeAttribute(attr.name);
          // multiple attributes like :id:for=""
          let names = attr.name.slice(1).split(prefix)
          // NOTE: secondary directives don't stop flow nor extend state, so no need to check
          for (let name of names) disposes.push(genericDirective(el, attr.value, state, name));
        } else i++;
      }
    }

    for (let i = 0, child; child = el.children[i]; i++) {
      // if element was removed from parent (skipped) - reduce index
      if (init(child, el) === false) i--;
    }
  };

  init(container);

  // if element was spraed by :scope or :each instruction - skip
  if (memo.has(container)) return state; //memo.get(container)

  // save
  memo.set(container, state);

  // expose dispose
  if (disposes.length) container[_dispose] = (d) => {
    while (disposes.length) disposes.pop()?.();
    memo.delete(container);
  }

  return state;
}

export let signal, effect, computed, batch, untracked

// configure sprae signals
sprae.use = (s) => (
  signal = s.signal,
  effect = s.effect,
  computed = s.computed,
  batch = s.batch,
  untracked = s.untracked || ((fn) => fn())
)
sprae.use(signals)
