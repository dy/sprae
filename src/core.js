import createState, { fx, batch, sandbox } from './state.signals-proxy.js';
import defaultDirective, { primary, secondary, on } from './directives.js';

// provide dispose symbol
Symbol.dispose ||= Symbol('dispose');

// default root sandbox
sprae.globals = sandbox

// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (!container.children) return
  if (memo.has(container)) return batch(() => Object.assign(memo.get(container), values))

  const state = createState(values || {});
  const updates = [], disposes = []

  // init directives on element
  const init = (el, parent = el.parentNode) => {
    // init primary attributes first
    for (let name in primary) {
      let attrName = ':' + name
      if (el.hasAttribute?.(attrName)) {
        let expr = el.getAttribute(attrName)
        el.removeAttribute(attrName)

        updates.push(primary[name](el, expr, state, name))

        // stop if element was spraed by directive or skipped (detached)
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
            updates.push(dir(el, expr, state, name));
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

  // call updates: subscribes directives to state;
  // saves disposal functions
  // FIXME: make sure internal states are disposed as well
  for (let update of updates) if (update) {
    // save teardown under specifix index
    const idx = disposes.length
    disposes.push(null, fx(() => {
      disposes[idx]?.();
      disposes[idx] = update(state);
    }));
  }

  memo.set(container, state);

  // export disposer
  state[Symbol.dispose] = () => {
    while (disposes.length) disposes.shift()?.();
    memo.delete(container);
  };

  return state;
}
