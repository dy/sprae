import sube, { observable } from 'sube';

// autoinit
const s = document.currentScript
if (s && s.hasAttribute('init')) {
  sprae(document.documentElement)
}

let curEl, curDir;
// sprae element: apply directives
export default function sprae(el, initScope) {
  initScope ||= {};

  let updates=[], // all spray directive updators
      ready=false;

  const update = (values) => { updates.forEach(update => update(values)); };

  // hook up observables (deeply, to include item.text etc)
  // that's least evil compared to dlv/dset or proxies
  // returns dynamic values snapshot
  const rsube = (scope) => {
    let values = {}
    for (let k in scope) {
      let v = scope[k];
      if (observable(v = scope[k])) values[k] = null, registry.register(v, sube(v, v => (values[k] = v, ready && update(values))));
      // FIXME: add []
      else if (v?.constructor === Object) values[k] = rsube(v);
      else values[k] = v;
    }
    return values;
  };
  const values = rsube(initScope);
  ready = true;

  // prepare directives - need to be after subscribing to values to get init state here
  for (let name in directives) {
    // updates[dir] = directives[dir](el)
    const sel = `[${name.replace(':','\\:')}]`,
          initDirective = directives[name]

    // FIXME: possibly linear init of directives is better, who knows
    const els = [...el.querySelectorAll(sel)];
    if (el.matches?.(sel)) els.unshift(el);

    let update
    for (let el of els) if (update = initDirective(el, values)) updates.push(update);
  };

  update(values);

  // return update via destructuring of result to allow batch-update
  values[Symbol.iterator] = function*(){ yield proxy; yield (diff) => update(Object.assign(values, diff)); };

  const proxy = new Proxy(values,  {
    set: (s, k, v) => (values[k]=v, update(values), 1),
    deleteProperty: (s, k) => (values[k]=undefined, update(values), 1)
  });

  return proxy
}

// dict of directives
const directives = {}

// register a directive
export const directive = (name, initializer) => {
  const className = name.replace(':','∴')

  // create initializer of a directive on an element
  return directives[name] = (el, initValues) => {
    if (el.classList.contains(className)) return
    el.classList.add(className)
    let expr = el.getAttribute(name)
    el.removeAttribute(name)
    return initializer(el, expr, initValues);
  }
}

const registry = new FinalizationRegistry(unsub => unsub?.call?.())

let evaluatorMemo = {}

// borrowed from alpine: https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61
// it seems to be more robust than subscript
export function parseExpr(expression) {
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
      return exprError(e, expression)
    }
  }

  return evaluatorMemo[expression] = safeFunction()
}

export function exprError(error, expression) {
  Object.assign( error, { expression } )
  console.warn(`∴ ${error.message}\n\n${curDir}=${ expression ? `"${expression}"\n\n` : '' }`, curEl)
  setTimeout(() => { throw error }, 0)
  return Promise.resolve()
}
