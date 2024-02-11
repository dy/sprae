import createState, { batch, sandbox, _dispose } from './state.signals-proxy.js';
import defaultDirective, { primary, secondary } from './directives.js';


// default root sandbox
sprae.globals = sandbox

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return // ignore what?

  if (memo.has(container)) return batch(() => Object.assign(memo.get(container), values))

  // take over existing state instead of creating clone
  const state = values || {};
  const disposes = []

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
          // FIXME: do we need to wrap into {} here?
          let expr = prefix === '@' ? `event=>{${attr.value}}` : attr.value,
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
  if (memo.has(container)) return state //memo.get(container)

  // save
  memo.set(container, state);

  // expose dispose
  if (disposes.length) Object.defineProperty(container, _dispose, {
    value: () => {
      while (disposes.length) disposes.shift()?.();
      memo.delete(container);
    }
  });

  return state;
}
