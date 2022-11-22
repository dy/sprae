// directives & parsing
import sprae, { directive } from './core.js'
import { prop, input } from 'element-props'
import { effect, computed } from '@preact/signals-core'

directive(':with', (el, expr, rootState) => {
  let evaluate = parseExpr(expr, 'with')

  // Instead of extending signals (which is a bit hard since signal-struct internals is not uniform)
  // we bind updating
  const params = computed(() => Object.assign({}, rootState, evaluate(rootState)))
  let [,update] = sprae(el, params.value)
  params.subscribe(update)
})


directive(':if', (el, expr, state) => {
  let holder = new Text,
      clauses = [parseExpr(expr, 'if')],
      els = [el], cur = el

  while (cur = el.nextElementSibling) {
    if (cur.hasAttribute(':else')) {
      cur.removeAttribute(':else');
      if (expr = cur.getAttribute(':if')) {
        cur.removeAttribute(':if'), cur.remove();
        els.push(cur); clauses.push(parseExpr(expr, 'else-if'));
      }
      else {
        cur.remove(); els.push(cur); clauses.push(() => 1);
      }
    }
    else break;
  }

  el.replaceWith(cur = holder)

  let idx = computed(() => clauses.findIndex(f => f(state)))
  // NOTE: it lazily initializes elements on insertion
  idx.subscribe(i => els[i] != cur && (cur.replaceWith(cur = els[i] || holder), sprae(cur, state)))
})


directive(':each', (tpl, expr, state) => {
  let each = parseForExpression(expr);
  if (!each) return exprError(new Error, expr);

  const getItems = parseExpr(each.items);

  // FIXME: make sure no memory leak here
  const holder = new Text
  tpl.replaceWith(holder)
  let els = [];

  const [signals] = state
  const items = getItems(signals)
  const itemScopes = computed(() => {
    let list = items.value
    if (typeof list === 'number') list = Array.from({length: list}, (_, i)=>i+1)
    // FIXME: avoid recreating plenty of items every time - cache by `item.id` maybe?
    // or maybe make each item scope a signal? whenever item changes it just rerenders instance
    // FIXME: also for signal-struct it might be costly to convert any-array into a signal
    return (list || []).map(item => {
      const scope = Object.assign({}, signals);
      scope[each.item] = item;
      if (each.index) scope[each.index] = i;
      return scope
    })
  });

  // FIXME: there can DOM swapper be used instead
  const update = (scopes) => {
    els.forEach(el => el.remove()); els = [];
    scopes.value.forEach((scope,i) => {
      let el = tpl.cloneNode(true);
      els.push(el);
      holder.before(el);
      sprae(el, scope);
    });
  }
  itemScopes.subscribe(update)
})

// This was taken AlpineJS, former VueJS 2.* core. Thanks Alpine & Vue!
function parseForExpression(expression) {
  let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
  let stripParensRE = /^\s*\(|\)\s*$/g
  let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
  let inMatch = expression.match(forAliasRE)

  if (!inMatch) return

  let res = {}
  res.items = inMatch[2].trim()
  let item = inMatch[1].replace(stripParensRE, '').trim()
  let iteratorMatch = item.match(forIteratorRE)

  if (iteratorMatch) {
      res.item = item.replace(forIteratorRE, '').trim()
      res.index = iteratorMatch[1].trim()
  } else {
      res.item = item
  }

  return res
}


// common-setter directives
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
