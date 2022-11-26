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
        if (attr.name[0]===':') {
          dir = directives[attr.name] || directives.default
          el.removeAttribute(attr.name)
          if (stop = (dir(el, attr.value, state, attr.name.slice(1))===false)) break
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