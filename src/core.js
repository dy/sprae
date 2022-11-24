import signalStruct from 'signal-struct';

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return
  if (memo.has(container)) return memo.get(container)

  values ||= {};

  const state = signalStruct(values);

  // init directives on element
  const init = (el) => {
    let dir, stop
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length;) {
        let attr = el.attributes[i]
        if (dir = directives[attr.name]) {
          el.removeAttribute(attr.name)
          if (stop = (dir(el, attr.value, state)===false)) break
        }
        else i++
      }
    }
    if (!stop) for (let child of el.children) init(child)
  }
  init(container)

  memo.set(container, state);

  return state;
}


// dict of directives
export const directives = {}

// register a directive
export const directive = (name, initialize) => {
  // create initializer of a directive on an element
  return directives[name] = initialize
}
