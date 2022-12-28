import signalStruct from 'signal-struct';
import defaultDirective, { directives } from './directives.js';
import { effect, computed, batch } from '@preact/signals-core'

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return
  if (memo.has(container)) return memo.get(container)

  values ||= {};

  const updates = []

  // init directives on element
  const init = (el, parent=el.parentNode) => {
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length;) {
        let attr = el.attributes[i]
        if (attr.name[0] !== ':') {i++; continue}
        el.removeAttribute(attr.name)
        let expr = attr.value
        if (!expr) continue
        let attrNames = attr.name.slice(1).split(':')
        for (let attrName of attrNames) {
          let dir = directives[attrName] || defaultDirective;
          updates.push(dir(el, expr, values, attrName) || (()=>{}));

          // stop if element was spraed by directive or skipped
          if (memo.has(el) || el.parentNode !== parent) return false
        }
      }
    }

    for (let i = 0, child; child = el.children[i]; i++) {
      // if element was removed from parent (skipped) - reduce index
      if (init(child, el) === false) i--
    }
  }

  init(container);

  // call updates: subscribes directives to state;
  // state is created after inits because directives can extend init values (expose refs etc)
  const state = signalStruct(values);
  for (let update of updates) effect(() => update(state));

  memo.set(container, state);

  return state;
}
