// directives & parsing
import sprae from './core.js'
import swap from 'swapdom'
import signalStruct from 'signal-struct'
import p from 'primitive-pool'

// reserved directives - order matters!
export const directives = {}

// any-prop directives
export default (el, expr, values, name) => {
  let evt = name.startsWith('on') && name.slice(2)
  let evaluate = parseExpr(el, expr, ':'+name)
  if (evaluate) return evt ? state => {
    let value = evaluate(state)
    if (value) {
      addListener(el, evt, value)
      return () => removeListener(el, evt, value)
    }
  }
  : state => attr(el, name, evaluate(state))
}

// set attr
const attr = (el, name, v) => {
  if (v == null || v === false) el.removeAttribute(name)
  else el.setAttribute(name, v === true ? '' : (typeof v === 'number' || typeof v === 'string') ? v : '')
}

directives[''] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':')
  if (evaluate) return (state) => {
    let value = evaluate(state)
    for (let key in value) attr(el, dashcase(key), value[key]);
  }
}

directives['with'] = (el, expr, rootState) => {
  let evaluate = parseExpr(el, expr, 'with')
  sprae(el, signalStruct(evaluate(rootState), rootState));
}

directives['if'] = (el, expr) => {
  let holder = document.createTextNode(''),
      clauses = [parseExpr(el, expr, ':if')],
      els = [el], cur = el

  while (cur = el.nextElementSibling) {
    if (cur.hasAttribute(':else')) {
      cur.removeAttribute(':else');
      if (expr = cur.getAttribute(':if')) {
        cur.removeAttribute(':if'), cur.remove();
        els.push(cur); clauses.push(parseExpr(el, expr, ':else :if'));
      }
      else {
        cur.remove(); els.push(cur); clauses.push(() => 1);
      }
    }
    else break;
  }

  el.replaceWith(cur = holder)

  return (state) => {
    let i = clauses.findIndex(f => f(state))
    if (els[i] != cur) {
      (cur[_each] || cur).replaceWith(cur = els[i] || holder);
      // NOTE: it lazily initializes elements on insertion, it's safe to sprae multiple times
      sprae(cur, state);
    }
  }
}

const _each = Symbol(':each'), _ref = Symbol(':ref'), _key = Symbol(':key')

directives['ref'] = (el, expr, state) => {
  // make sure :ref is initialized after :each (return to avoid initializing as signal)
  if (el.hasAttribute(':each')) {el[_ref] = expr; return};

  // FIXME: wait for complex ref use-case
  // parseExpr(el, `__scope[${expr}]=this`, ':ref')(values)
  state[expr] = el;
}

directives['key'] = (el, expr, state) => {
  // make sure :ref is initialized after :each (return to avoid initializing as signal)
  if (el.hasAttribute(':each')) {el[_key] = expr; return};
}

directives['each'] = (tpl, expr) => {
  let each = parseForExpression(expr);
  if (!each) return exprError(new Error, tpl, expr);

  // FIXME: make sure no memory leak here
  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = tpl[_each] = document.createTextNode('')
  tpl.replaceWith(holder)

  const evaluate = parseExpr(tpl, each[2], ':each');

  const keyExpr = tpl[_key] || tpl.getAttribute(':key');
  const itemKey = keyExpr ? parseExpr(null, keyExpr) : null;
  tpl.removeAttribute(':key')


  const scopes = new WeakMap() // stores scope per data item
  const itemEls = new WeakMap() // element per data item
  let curEls = []

  return (state) => {
    // get items
    let list = evaluate(state)

    if (!list) list = []
    else if (typeof list === 'number') list = Array.from({length: list}, (_, i)=>[i, i+1])
    else if (Array.isArray(list)) list = list.map((item,i) => [i+1, item])
    else if (typeof list === 'object') list = Object.entries(list)
    else exprError(Error('Bad list value'), tpl, expr, ':each', list)

    // collect elements/scopes for items
    let newEls = [], elScopes = []

    for (let [idx, item] of list) {
      let el, scope, key = itemKey?.({[each[0]]: item, [each[1]]: idx})
      if (isPrimitive(key)) key = p(key); // singletonize key

      // we consider if data items are primitive, then nodes needn't be cached
      // since likely they're very simple to create
      if (key == null) el = tpl.cloneNode(true);
      else (el = itemEls.get(key)) || itemEls.set(key, el = tpl.cloneNode(true));

      newEls.push(el)

      if (key == null || !(scope = scopes.get(key))) {
        scope = signalStruct({[each[0]]: item, [each[1]]:idx}, state)
        // provide ref, if indicated
        if (tpl[_ref]) scope[tpl[_ref]] = el
        if (key != null) scopes.set(key, scope)
      }
      // need to explicitly set item to update existing children's values
      else scope[each[0]] = item

      elScopes.push(scope)
    }

    // swap is really fast & tiny
    swap(holder.parentNode, curEls, newEls, holder)
    curEls = newEls

    // init new elements
    for (let i = 0; i < newEls.length; i++) {
      sprae(newEls[i], elScopes[i])
    }
  }
}

// This was taken AlpineJS, former VueJS 2.* core. Thanks Alpine & Vue!
function parseForExpression(expression) {
  let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/
  let stripParensRE = /^\s*\(|\)\s*$/g
  let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/
  let inMatch = expression.match(forAliasRE)

  if (!inMatch) return

  let items = inMatch[2].trim()
  let item = inMatch[1].replace(stripParensRE, '').trim()
  let iteratorMatch = item.match(forIteratorRE)

  if (iteratorMatch) return [
    item.replace(forIteratorRE, '').trim(),
    iteratorMatch[1].trim(),
    items
  ]

  return [item, '', items]
}

directives['id'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':id')
  const update = v => el.id = v || v === 0 ? v : ''
  return (state) => update(evaluate(state))
}

directives['class'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':class')
  let initClassName = el.className
  return (state) => {
    let v = evaluate(state)
    el.className = initClassName + typeof v === 'string' ? v : (Array.isArray(v) ? v : Object.entries(v).map(([k,v])=>v?k:'')).filter(Boolean).join(' ')
  }
}

directives['style'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':style')
  let initStyle = el.getAttribute('style') || ''
  if (!initStyle.endsWith(';')) initStyle += '; '
  return (state) => {
    let v = evaluate(state)
    if (typeof v === 'string') el.setAttribute('style', initStyle + v)
    else for (let k in v) el.style[k] = v[k]
  }
}

directives['text'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':text')

  return (state) => {
    let value = evaluate(state)
    el.textContent = value == null ? '' : value;
  }
}

// connect expr to element value
directives['value'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':value')

  let from, to
  let update = (
    el.type === 'text' || el.type === '' ? value => el.setAttribute('value', el.value = value == null ? '' : value) :
    el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === '' ? value => (
      // we retain selection in input
      from = el.selectionStart, to = el.selectionEnd,
      el.setAttribute('value', el.value = value == null ? '' : value),
      from && el.setSelectionRange(from, to)
    ) :
    el.type === 'checkbox' ? value => (el.value = value ? 'on' : '', attr(el, 'checked', value)) :
    el.type === 'select-one' ? value => {
      for (let option in el.options) option.removeAttribute('selected')
      el.value = value;
      el.selectedOptions[0]?.setAttribute('selected', '')
    } :
    value => el.value = value
  )

  return (state) => update(evaluate(state))
}

directives['on'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':on')

  return (state) => {
    let listeners = evaluate(state);
    for (let evt in listeners) addListener(el, evt, listeners[evt])
    return () => {
      for (let evt in listeners) removeListener(el, evt, listeners[evt])
    }
  }
}

const _stop = Symbol('stop')
const addListener = (el, evt, startFn) => {
  if (evt.indexOf('..')<0) el.addEventListener(evt, startFn);

  // sequences like `a..b`: fn
  else {
    const evts = evt.split('..').map(e => e.startsWith('on') ? e.slice(2) : e)
    const nextEvt = (fn, cur=0) => {
      let curListener = e => {
        el.removeEventListener(evts[cur], curListener)
        if (typeof (fn = fn.call(el,e)) !== 'function') fn = ()=>{}
        if (++cur < evts.length) nextEvt(fn, cur);
        else if (!startFn[_stop]) nextEvt(startFn); // update only if chain isn't stopped
      }
      el.addEventListener(evts[cur],curListener)
    }
    nextEvt(startFn)
  }
}
const removeListener = (el, evt, fn) => {
  if (evt.indexOf('..')>=0) fn[_stop] = true
  el.removeEventListener(evt, fn);
}

directives['data'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':data')

  return ((state) => {
    let value = evaluate(state)
    for (let key in value) el.dataset[key] = value[key];
  })
}

directives['aria'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':aria')
  const update = (value) => {
    for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '');
  }
  return ((state) => update(evaluate(state)))
}


let evaluatorMemo = {}

// borrowed from alpine: https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61
// it seems to be more robust than subscript
function parseExpr(el, expression, dir) {
  // guard static-time eval errors
  let evaluate = evaluatorMemo[expression]

  if (!evaluate) {
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

    try {
      evaluate = evaluatorMemo[expression] = new Function(`__scope`,`with (__scope) { return ${rightSideSafeExpression} };`)
    } catch ( e ) {
      return exprError(e, el, expression, dir)
    }
  }

  // guard runtime eval errors
  return (state) => {
    let result
    try { result = evaluate.call(el, state); }
    catch (e) { return exprError(e, el, expression, dir) }
    return result
  }
}

export function exprError(error, element, expression, dir) {
  Object.assign( error, { element, expression } )
  console.warn(`∴ ${error.message}\n\n${dir}=${ expression ? `"${expression}"\n\n` : '' }`, element)
  setTimeout(() => { throw error }, 0)
}

function dashcase(str) {
	return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => '-' + match.toLowerCase());
};

function isPrimitive(obj) {
  return typeof obj === 'string' || typeof obj === 'boolean' || typeof obj === 'number'
}