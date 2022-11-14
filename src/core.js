import sube, { observable } from 'sube';

// autoinit
const s = document.currentScript
if (s && s.hasAttribute('init')) {
  sprae(document.documentElement)
}

// sprae element: apply directives
export default function sprae(el, initScope) {
  initScope ||= {};

  let updates=[], // all spray directive updators
      ready=false;

  // prepare directives
  for (let dir in directives) updates[dir] = directives[dir](el);

  const update = (values) => { for (let dir in updates) updates[dir].forEach(update => update(values)); };

  // hook up observables (deeply, to include item.text etc)
  // that's least evil compared to dlv/dset or proxies
  // returns dynamic values snapshot
  const rsube = (scope) => {
    let values = {}
    for (let k in scope) {
      let v = scope[k];
      if (observable(v = scope[k])) registry.register(v, sube(v, v => (values[k] = v, ready && update(values))));
      // FIXME: add []
      else if (v?.constructor === Object) values[k] = rsube(v);
      else values[k] = v;
    }
    return values;
  };
  const values = rsube(initScope);
  update(values);
  ready = true;

  // return update via destructuring of result to allow batch-update
  values[Symbol.iterator] = function*(){ yield proxy; yield (diff) => update(Object.assign(values, diff)); };

  const proxy = new Proxy(values,  {
    set: (s, k, v) => (values[k]=v, update(values), 1),
    deleteProperty: (s, k) => (values[k]=undefined, update(values), 1)
  });

  return proxy
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
      if (!el.classList.contains(`∴${name}`))
        el.classList.add(`∴${name}`), updates.push(initializer(el));
    }

    return updates
  }
}

const registry = new FinalizationRegistry(unsub => unsub?.call?.())