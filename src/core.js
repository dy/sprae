import signalStruct from 'signal-struct';
import defaultDirective, { directives } from './directives.js';
import { effect, computed, batch } from '@preact/signals-core'

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return
  if (memo.has(container)) return memo.get(container)

  values ||= {};

  const state = signalStruct(values);

  // init directives on element
  const init = (el) => {
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length;) {
        let attr = el.attributes[i]
        if (attr.name[0] !== ':') {i++; continue}
        el.removeAttribute(attr.name)
        let expr = attr.value
        let attrNames = attr.name.slice(1).split(':')
        for (let attrName of attrNames) {
          let dir = directives[attrName] || defaultDirective
          let res = dir(el, expr, state, attrName)
          // stop if element was initialized already
          if (memo.has(el)) return 0
          if (res <= 0) return res
        }
      }
    }

    for (let i = 0, child; child = el.children[i]; i++) {
      let res = init(child) || 0 // reduce number of removed elements
      i += res
    }
  }

  init(container)

  memo.set(container, state);

  return state;
}
