import { signal, batch } from '@preact/signals-core';
import defaultDirective, { primary, secondary } from './directives.js';

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  // ignore non-element nodes
  if (!container.children) return

  // update values signal
  if (memo.has(container)) {
    const [dispose, state] = memo.get(container)
    const prev = state.peek(), cur = values.valueOf()
    batch(() => (Object.assign(prev, cur), state.value = null, state.value = prev))
    return dispose
  }

  // create signal representation of init values - to let attrs react on update
  const disposes = [], state = values?.peek ? values : signal(values)

  // init directives on element
  const init = (el, parent = el.parentNode) => {
    // init primary attributes first
    for (let name in primary) {
      let attrName = ':' + name
      if (el.hasAttribute?.(attrName)) {
        let expr = el.getAttribute(attrName)
        el.removeAttribute(attrName)

        disposes.push(primary[name](el, expr, state, name))

        // stop if element was spraed by directive or skipped (detached) like in case of :if or :each
        if (memo.has(el)) return
        if (el.parentNode !== parent) return false
      }
    }

    // catch other attributes as secondary
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length;) {
        let attr = el.attributes[i], prefix = attr.name[0]

        if (prefix === ':' || prefix === '@') {
          el.removeAttribute(attr.name)
          let expr = prefix === '@' ? `${attr.value.includes('await') ? 'async' : ''} event=>{${attr.value}}` : attr.value,
            names = attr.name.slice(1).split(prefix)

          // multiple attributes like :id:for="" or @click@touchstart
          for (let name of names) {
            // @click forwards to :onclick=event=>{...inline}
            if (prefix === '@') name = `on` + name
            let dir = secondary[name] || defaultDirective;
            disposes.push(dir(el, expr, state, name));
            // NOTE: secondary directives don't stop flow nor extend state, so no need to check
          }
        }
        else i++;
      }
    }

    for (let i = 0, child; child = el.children[i]; i++) {
      // if element was removed from parent (skipped) - reduce index
      if (init(child, el) === false) i--
    }
  }

  init(container);

  // if element was spraed by :with or :each instruction - skip
  if (memo.has(container)) return memo.get(container)[0]

  // save & return destructor
  const dispose = () => {
    while (disposes.length) disposes.shift()?.();
    memo.delete(container);
  }
  memo.set(container, [dispose, state]);

  return dispose
}
