import signalStruct from 'signal-struct';
import { signal, effect } from '@preact/signals-core';

signalStruct.signal = signal;

let curEl, curDir;
// sprae element: apply directives
export default function sprae(el, init) {
  init ||= {};

  // return update via destructuring of result to allow batch-update
  init[Symbol.iterator] = function*(){ yield state; yield (diff) => Object.assign(state, diff); };

  const state = signalStruct(init);

  // prepare directives - need to be after subscribing to values to get init state here
  for (let name in directives) {
    const sel = `[${name.replace(':','\\:')}]`,
          initDirective = directives[name]

    if (el.matches?.(sel)) initDirective(el, state);
    el.querySelectorAll?.(sel).forEach(el => initDirective(el, state));
  };

  return state
}

// dict of directives
const directives = {}

// register a directive
export const directive = (name, initialize, parse=parseExpr) => {
  const className = name.replace(':','∴')

  // create initializer of a directive on an element
  return directives[name] = (el, state) => {
    if (el.classList.contains(className)) return
    el.classList.add(className)
    let expr = el.getAttribute(name)
    el.removeAttribute(name)
    let evaluate = parse(expr)
    let update = initialize(el, expr, state)
    // evaluate autosubscribes to only fraction of dependencies
    // - whenever they change, update is called with result of evaluator
    effect(() => update(evaluate(state)))
  }
}

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
