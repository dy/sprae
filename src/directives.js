// directives & parsing
import sprae, { directive } from './core.js'
import { prop, input } from 'element-props'
import { effect, computed } from '@preact/signals-core'

directive(':with', (el, expr, rootState) => {
  let evaluate = parseExpr(expr, 'with')
  const [rootSignals] = rootState

  // it subsprays with shadowed values
  // sub-structure combines root signals with evaluated signals
  sprae(el, Object.assign({}, rootSignals, evaluate(rootSignals)));
})


common(`id`), common(`name`), common(`for`), common(`type`), common(`hidden`), common(`disabled`), common(`href`), common(`src`), common(`style`), common(`class`)

function common(name) {
  directive(':'+name, (el, expr, state) => {
    let evaluate = parseExpr(expr, name)
    // evaluate autosubscribes to only fraction of dependencies
    // - whenever they change, update is called with result of evaluator

    const update = value => prop(el, name, value)

    effect(() => update(evaluate(state)))
  })
}

directive(':aria', (el, expr, state) => {
  let evaluate = parseExpr(expr, 'aria')
  const update = (value) => {
    for (let key in value) prop(el, 'aria'+key[0].toUpperCase()+key.slice(1), value[key]);
  }
  const value = computed(() => evaluate(state))
  value.subscribe(update)
})

directive(':data', (el, expr, state) => {
  let evaluate = parseExpr(expr, 'aria')
  const value = computed(() => evaluate(state))
  value.subscribe((value) => {
    for (let key in value) el.dataset[key] = value[key];
  })
})

directive(':on', (el, expr, state) => {
  let evaluate = parseExpr(expr, 'aria')
  let listeners = computed(() => evaluate(state))
  let prevListeners
  listeners.subscribe((values) => {
    for (let evt in prevListeners) el.removeEventListener(evt, prevListeners[evt]);
    prevListeners = values;
    for (let evt in prevListeners) el.addEventListener(evt, prevListeners[evt]);
  })
})

directive(':prop', (el, expr, state) => {
  let evaluate = parseExpr(expr, 'prop')
  const update = (value) => {
    if (!value) return
    for (let key in value) prop(el, key, value[key]);
  }
  const value = computed(() => evaluate(state))
  value.subscribe(update)
})

directive(':text', (el, expr, state) => {
  let evaluate = parseExpr(expr, 'text')

  const update = (value) => {
    el.textContent = value == null ? '' : value;
  }

  const value = computed(() => evaluate(state))
  value.subscribe(update)
})

// connect expr to element value
directive(':value', (el, expr, state) => {
  let evaluate = parseExpr(expr, 'value')

  let [get, set] = input(el);
  let evaluateSet = parseSetter(expr);
  let onchange = e => evaluateSet(state, get(el));
  // FIXME: double update can be redundant
  el.addEventListener('input', onchange);
  el.addEventListener('change', onchange);

  const value = computed(() => evaluate(state))
  value.subscribe((value) => {
    prop(el, 'value', value)
    set(value);
  })
})

const memo = {}
function parseSetter(expr) {
  if (memo[expr]) return memo[expr]
  return memo[expr] = new Function(
    ['scope', 'value'],
    `with (scope) { ${expr} = value };`
  )
}

let evaluatorMemo = {}

// borrowed from alpine: https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61
// it seems to be more robust than subscript
function parseExpr(expression, dir) {
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
        : expression;

  // guard static-time eval errors
  let evaluate
  try {
    evaluate = new Function(['scope'], `let result; with (scope) { result = ${rightSideSafeExpression} }; return result;`)
  } catch ( e ) {
    return exprError(e, expression, dir)
  }

  // guard runtime eval errors
  return evaluatorMemo[expression] = (state) => {
    let result
    try { result = evaluate(state) }
    catch (e) { return exprError(e, expression, dir) }
    return result
  }
}

export function exprError(error, expression, dir) {
  Object.assign( error, { expression } )
  console.warn(`∴ ${error.message}\n\n${dir}=${ expression ? `"${expression}"\n\n` : '' }`)
  setTimeout(() => { throw error }, 0)
}
