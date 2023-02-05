// directives & parsing
import sprae from './core.js'
import swap from './domdiff.js'
import signalStruct from 'signal-struct'
import p from 'primitive-pool'

// reserved directives - order matters!
// primary initialized first by selector, secondary initialized by iterating attributes
export const primary = {}, secondary = {}


// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
primary['if'] = (el, expr) => {
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
      ;(cur[_each] || cur).replaceWith(cur = els[i] || holder);
      // NOTE: it lazily initializes elements on insertion, it's safe to sprae multiple times
      // but :if must come first to avoid preliminary caching
      sprae(cur, state);
    }
  }
}

// :with must come before :each, but :if has primary importance
primary['with'] = (el, expr, rootState) => {
  let evaluate = parseExpr(el, expr, 'with')
  sprae(el, signalStruct(evaluate(rootState), rootState));
}

const _each = Symbol(':each')

// :each must init before :ref, :id or any others, since it defines scope
primary['each'] = (tpl, expr) => {
  let each = parseForExpression(expr);
  if (!each) return exprError(new Error, tpl, expr);

  // FIXME: make sure no memory leak here
  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = tpl[_each] = document.createTextNode('')
  tpl.replaceWith(holder)

  const evaluate = parseExpr(tpl, each[2], ':each');

  const keyExpr = tpl.getAttribute(':key');
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


secondary['ref'] = (el, expr, state) => {
  // FIXME: wait for complex ref use-case
  // parseExpr(el, `__scope[${expr}]=this`, ':ref')(values)
  state[expr] = el;
}

secondary['id'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':id')
  const update = v => el.id = v || v === 0 ? v : ''
  return (state) => update(evaluate(state))
}

secondary['class'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':class')
  let initClassName = el.className
  return (state) => {
    let v = evaluate(state)
    let className = typeof v === 'string' ? v : (Array.isArray(v) ? v : Object.entries(v).map(([k,v])=>v?k:'')).filter(Boolean).join(' ')
    el.className = [initClassName, className].filter(Boolean).join(' ');
  }
}

secondary['style'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':style')
  let initStyle = el.getAttribute('style') || ''
  if (!initStyle.endsWith(';')) initStyle += '; '
  return (state) => {
    let v = evaluate(state)
    if (typeof v === 'string') el.setAttribute('style', initStyle + v)
    else {
      el.setAttribute('style', initStyle)
      for (let k in v) el.style.setProperty(k, v[k])
    }
  }
}

secondary['text'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':text')

  return (state) => {
    let value = evaluate(state)
    el.textContent = value == null ? '' : value;
  }
}

secondary['data'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':data')

  return ((state) => {
    let value = evaluate(state)
    for (let key in value) el.dataset[key] = value[key];
  })
}

secondary['aria'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':aria')
  const update = (value) => {
    for (let key in value) attr(el, 'aria-' + dashcase(key), value[key] == null ? null : value[key] + '');
  }
  return ((state) => update(evaluate(state)))
}

// set props in-bulk or run effect
secondary[''] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':')
  if (evaluate) return (state) => {
    let value = evaluate(state)
    for (let key in value) attr(el, dashcase(key), value[key]);
  }
}

// connect expr to element value
secondary['value'] = (el, expr) => {
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

secondary['on'] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ':on')

  return (state) => {
    let listeners = evaluate(state);
    let offs = []; for (let evt in listeners) offs.push(on(el, evt, listeners[evt]));
    return () => {
      for (let off of offs) off()
    }
  }
}

// any unknown directive
export default (el, expr, state, name) => {
  let evt = name.startsWith('on') && name.slice(2)
  let evaluate = parseExpr(el, expr, ':'+name)

  if (!evaluate) return

  if (evt) return (state => {
    // we need anonymous callback to enable modifiers like prevent
    let value = evaluate(state) || (()=>{})
    return on(el, evt, value)
  })

  return state => attr(el, name, evaluate(state))
}

// bind event to target
const on = (target, evt, origFn) => {
  if (!origFn) return

  // ona..onb
  let ctxs = evt.split('..').map(e => {
    let ctx = { evt:'', target, test:()=>true };
    // onevt.debounce-108 -> evt.debounce-108
    ctx.evt = (e.startsWith('on') ? e.slice(2) : e).replace(/\.(\w+)?-?([-\w]+)?/g,
      (match, mod, param='') => (ctx.test = mods[mod]?.(ctx, ...param.split('-')) || ctx.test, '')
    );
    return ctx;
  });

  // single event bind
  if (ctxs.length == 1) return addListener(origFn, ctxs[0])

  // events chain cycler
  const onFn = (fn, cur=0) => {
    let off
    let curListener = e => {
      if (cur) off(); // don't remove entry listener - we must keep chain entry always open
      let nextFn = fn.call(target, e)
      if (typeof nextFn !== 'function') nextFn = ()=>{}
      if (cur+1 < ctxs.length) onFn(nextFn, !cur ? 1 : cur+1);
    }
    return off = addListener(curListener, ctxs[cur])
  }
  let rootOff = onFn(origFn)
  return () => rootOff()

  // add listener applying the context
  function addListener(fn, {evt, target, test, defer, stop, prevent, ...opts} ) {
    if (defer) fn = defer(fn)

    let cb = e => test(e) && (
      stop&&e.stopPropagation(),
      prevent&&e.preventDefault(),
      fn.call(target, e)
    )

    target.addEventListener(evt, cb, opts)
    return () => target.removeEventListener(evt, cb, opts)
  };
}

// event modifiers
const mods = {
  // actions
  prevent(ctx) { ctx.prevent = true },
  stop(ctx) { ctx.stop = true },

  // options
  once(ctx) { ctx.once = true; },
  passive(ctx) { ctx.passive = true; },
  capture(ctx) { ctx.capture = true; },

  // target
  window(ctx) { ctx.target = window },
  document(ctx) { ctx.target = document },

  throttle(ctx, limit) { ctx.defer = fn => throttle(fn, limit ? Number(limit) || 0 : 108) },
  debounce(ctx, wait) { ctx.defer = fn => debounce(fn, wait ? Number(wait) || 0 : 108) },

  // test
  outside: ctx => e => {
    let target = ctx.target
    if (target.contains(e.target)) return false
    if (e.target.isConnected === false) return false
    if (target.offsetWidth < 1 && target.offsetHeight < 1) return false
    return true
  },
  self: ctx => e => e.target === ctx.target,

  // keyboard
  ctrl: (ctx, ...param) => e => keys.ctrl(e) && param.every(p => keys[p] ? keys[p](e) : e.key === p),
  shift: (ctx, ...param) => e => keys.shift(e) && param.every(p => keys[p] ? keys[p](e) : e.key === p),
  alt: (ctx, ...param) => e => keys.alt(e) && param.every(p => keys[p] ? keys[p](e) : e.key === p),
  meta: (ctx, ...param) => e => keys.meta(e) && param.every(p => keys[p] ? keys[p](e) : e.key === p),
  arrow: ctx => keys.arrow,
  enter: ctx => keys.enter,
  escape: ctx => keys.escape,
  tab: ctx => keys.tab,
  space: ctx => keys.space,
  backspace: ctx => keys.backspace,
  delete: ctx => keys.delete,
  digit: ctx => keys.digit,
  letter: ctx => keys.letter,
  character: ctx => keys.character,
};

// key testers
const keys = {
  ctrl: e => e.ctrlKey || e.key === 'Control' || e.key === 'Ctrl',
  shift: e => e.shiftKey || e.key === 'Shift',
  alt: e => e.altKey || e.key === 'Alt',
  meta: e => e.metaKey || e.key === 'Meta' || e.key === 'Command',
  arrow: e => e.key.startsWith('Arrow'),
  enter: e => e.key === 'Enter',
  escape: e => e.key.startsWith('Esc'),
  tab: e => e.key === 'Tab',
  space: e => e.key === ' ' || e.key === 'Space' || e.key === ' ',
  backspace: e => e.key === 'Backspace',
  delete: e => e.key === 'Delete',
  digit: e => /^\d$/.test(e.key),
  letter: e => /^[a-zA-Z]$/.test(e.key),
  character: e => /^\S$/.test(e.key)
}

// create delayed fns
const throttle = (fn, limit) => {
  let pause, planned, block = (e) => {
    pause = true
    setTimeout(() => {
      pause = false
      // if event happened during blocked time, it schedules call by the end
      if (planned) return (planned = false, block(e), fn(e))
    }, limit)
  }
  return (e) => {
    if (pause) return (planned = true)
    block(e);
    return fn(e);
  }
}
const debounce = (fn, wait) => {
  let timeout
  return (e) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {timeout = null; fn(e)}, wait)
  }
}

// set attr
const attr = (el, name, v) => {
  if (v == null || v === false) el.removeAttribute(name)
  else el.setAttribute(name, v === true ? '' : (typeof v === 'number' || typeof v === 'string') ? v : '')
}


// borrowed from alpine with improvements https://github.com/alpinejs/alpine/blob/main/packages/alpinejs/src/evaluator.js#L61
// it seems to be more robust than subscript
let evaluatorMemo = {}
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
      || /\b(let|const)\s/.test(expression)
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

function exprError(error, element, expression, dir) {
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