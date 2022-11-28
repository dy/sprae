import signalStruct from 'signal-struct';
import defaultDirective, { directives } from './directives.js';

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return
  if (memo.has(container)) return memo.get(container)

  values ||= {};

  const state = signalStruct(values);

  // init directives on element
  const init = (el) => {
    let dir, attr, res

    if (el.attributes) {
      // directives must be initialized in order
      for (let name in directives) {
        if (attr = el.attributes[name]) {
          dir = directives[name]
          el.removeAttribute(name)
          if ((res = dir(el, attr.value, state)) <= 0) return res
        }
      }

      for (let i = 0; i < el.attributes.length;) {
        let attr = el.attributes[i]
        if (attr.name[0]===':') {
          el.removeAttribute(attr.name)
          if ((res = defaultDirective(el, attr.value, state, attr.name.slice(1))) <= 0) return res
        }
        else i++
      }
    }

    for (let i = 0, child; child = el.children[i]; i++) {
      res = init(child) || 0 // reduce number of removed elements
      i += res
    }
  }

  init(container)

  memo.set(container, state);

  return state;
}
