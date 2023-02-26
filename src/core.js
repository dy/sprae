import { state as createState, fx, batch } from './state.js';
import defaultDirective, { primary, secondary } from './directives.js';

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return
  if (memo.has(container)) {
    let state = memo.get(container)
    batch(() => Object.assign(state, values))
    return state
  }

  // subscribe to reactives
  // for (let prop in values) {
  //   if (observable(values[prop])) {
  //     let value = values[prop]; values[prop] = null
  //     sube(value, value => state[prop] = value)
  //   }
  // }
  const state = createState(values || {});
  const updates = []

  // init directives on element
  const init = (el, parent=el.parentNode) => {
    // init primary attributes first
    for (let name in primary) {
      let attrName = ':' + name
      if (el.hasAttribute?.(attrName)) {
        let expr = el.getAttribute(attrName)
        el.removeAttribute(attrName)

        updates.push(primary[name](el, expr, state, name))

        // stop if element was spraed by directive or skipped (detached)
        if (memo.has(el) || el.parentNode !== parent) return false
      }
    }

    // catch other attributes as secondary
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length;) {
        let attr = el.attributes[i]
        if (attr.name[0] !== ':') {i++; continue}
        el.removeAttribute(attr.name)
        let expr = attr.value

        // multiple attributes like :id:for=""
        let attrNames = attr.name.slice(1).split(':')
        for (let attrName of attrNames) {
          let dir = secondary[attrName] || defaultDirective;
          updates.push(dir(el, expr, state, attrName));

          // stop if element was spraed by directive or skipped (detached)
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
  for (let update of updates) if (update) {
    let teardown
    fx(() => {
      if (typeof teardown === 'function') teardown()
      teardown = update(state)
    });
  }

  memo.set(container, state);

  return state;
}
