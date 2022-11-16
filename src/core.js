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
  const sel = `[${name.replace(':','\\:')}]`, className = name.replace(':','∴')

  return directives[name] = (container) => {
    const els = [...container.querySelectorAll(sel)];
    if (container.matches?.(sel)) els.unshift(container);

    const updates = [];

    // replace all shortcuts with inner templates
    for (let el of els) {
      if (!el.classList.contains(className)) {
        el.classList.add(className)
        let expr = el.getAttribute(name)
        el.removeAttribute(name)
        updates.push(initializer(el, expr));
      }
    }

    return updates
  }
}

const registry = new FinalizationRegistry(unsub => unsub?.call?.())


let evaluatorMemo = {}

// borrowed from alpine: https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61
// it seems to be more robust than subscript
export function parseExpr(expression, el) {
    if (evaluatorMemo[expression]) return evaluatorMemo[expression]

    // Some expressions that are useful in Alpine are not valid as the right side of an expression.
    // Here we'll detect if the expression isn't valid for an assignement and wrap it in a self-
    // calling function so that we don't throw an error AND a "return" statement can b e used.
    let rightSideSafeExpression = 0
      // Support expressions starting with "if" statements like: "if (...) doSomething()"
      || /^[\n\s]*if.*\(.*\)/.test(expression)
      // Support expressions starting with "let/const" like: "let foo = 'bar'"
      || /^(let|const)\s/.test(expression)
          ? `(() => { ${expression} })()`
          : expression

    const safeFunction = () => {
      try {
        return new Function(['scope'], `let result; with (scope) { result = ${rightSideSafeExpression} }; return result;`)
      } catch ( e ) {
        return exprError(e, expression, el)
      }
    }

    return evaluatorMemo[expression] = safeFunction()
}

export function exprError(error, expression, el) {
  Object.assign( error, { el, expression } )
  console.warn(`∴ Expression Error: ${error.message}\n\n${ expression ? 'Expression: \"' + expression + '\"\n\n' : '' }`, el)
  setTimeout(() => { throw error }, 0)
  return Promise.resolve()
}