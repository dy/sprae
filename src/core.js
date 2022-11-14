// autoinit
const s = document.currentScript
if (s && s.hasAttribute('init')) {
  sprae(document.documentElement)
}

// sprae element: apply directives
export default function sprae(el, scope) {
  scope ||= {};

  let params, updates=[];

  // prepare directives
  for (let dir in directives) updates[dir] = directives[dir](el, scope)

  const update = (diff=scope) => {
    if (diff !== scope) Object.assign(scope, diff);
    for (let dir in updates) updates[dir].forEach(update => update(scope))
  }

  update(scope)

  // return update via destructuring of result to allow batch-update
  scope[Symbol.iterator] = function*(){ yield params; yield update; }

  return params = new Proxy(scope,  {
    set: (s, k, v) => (scope[k]=v, update(), 1),
    deleteProperty: (s,k) => (delete scope[k], update(), 1)
  })
}

// dict of directives
const directives = {}, store = new WeakSet

// register a directive
export const directive = (name, initializer) => {
  const attr = `\\:${name}`, sel = `[${attr}]`
  return directives[name] = (container) => {
    const els = [...container.querySelectorAll(sel)];
    if (container.matches(sel)) els.unshift(container);

    const updates = [];

    // replace all shortcuts with inner templates
    for (let el of els) {
      // FIXME: make sure no leak is introduced here
      if (!store.has(el)) {
        store.add(el);
        let expr = el.getAttribute(':'+name);
        el.removeAttribute(':'+name);
        updates.push(initializer(el, expr));
      }
    }

    return updates
  }
}
