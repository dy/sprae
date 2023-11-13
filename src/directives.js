// directives & parsing
import sprae from './core.js'
import createState, { effect, computed, memo, untracked, _dispose } from './state.signals-proxy.js'
import { queueMicrotask, WeakishMap } from './util.js'

// reserved directives - order matters!
// primary initialized first by selector, secondary initialized by iterating attributes
export const primary = {}, secondary = {}

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
primary['if'] = (el, expr, state) => {
  let holder = document.createTextNode(''),
    clauses = [parseExpr(el, expr, ':if')],
    els = [el], cur = el

  // consume all following siblings with :else, :if into a single group
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

  const dispose = effect(() => {
    // find matched clause (re-evaluates any time any clause updates)
    let i = clauses.findIndex(f => f(state))
    if (els[i] != cur) {
      ; (cur[_each] || cur).replaceWith(cur = els[i] || holder);
      // NOTE: it lazily initializes elements on insertion, it's safe to sprae multiple times
      // but :if must come first to avoid preliminary caching
      sprae(cur, state);
    }
  })

  return () => {
    for (const el of els) el[_dispose]?.() // dispose all internal spraes
    dispose() // dispose subscription
  }
}

const _each = Symbol(':each'), _delete = Symbol('delete')

// :each must init before :ref, :id or any others, since it defines scope
primary['each'] = (tpl, expr, state) => {
  let each = parseForExpression(expr);
  if (!each) return exprError(new Error, tpl, expr, ':each');

  const [itemVar, idxVar, itemsExpr] = each;

  // we need :if to be able to replace holder instead of tpl for :if :each case
  // FIXME: I don't think _each is relevant anymore - :if seems to come first also it's sync
  const holder = tpl[_each] = document.createTextNode('')
  tpl.replaceWith(holder)

  const evaluate = parseExpr(tpl, itemsExpr, ':each');

  // const keyExpr = tpl.getAttribute(':key');
  // const itemKey = keyExpr ? parseExpr(null, keyExpr, ':each') : ()=>{};
  // tpl.removeAttribute(':key')

  // we re-create items any time new items are produced
  let items, prevl
  effect(() => {
    const newItems = evaluate(state)
    console.group('new items', items, newItems)

    if (!items) untracked(() => {
      items = newItems, prevl = items.length
      for (let i = 0, l = items.length; i < l; i++) initChild(i)
    })
    else untracked(() => {
      // dispose tail (done internally in state)
      // FIXME: what if new items are state-array
      let oldl = items.length, newl = newItems.length, i = 0
      // patch existing items and insert new items - init happens in length effect
      for (; i < newl; i++) console.log('PATCH', i, newItems[i]), items[i] = newItems[i]
      items.length = newItems.length
    })

    // length change effect
    const cleanup = effect(() => {
      console.log('LENGTH CHANGE')
      const newl = newItems.length
      untracked(() => {
        if (prevl > newl) console.log('less', prevl, newl) // dispose old items
      if (prevl !== newl) untracked(() => {
        if (prevl > newl) for (let i = newl; i < prevl; i++) items[i] = _delete
        else for (let i = prevl; i < newl; i++) initChild(i) // init new items
        prevl = newl
      })
    })

    console.groupEnd()

    return cleanup
  })

  function initChild(i) {
    const el = tpl.cloneNode(true), scope = createState({ [itemVar]: items[i], [idxVar]: i }, state)
    holder.before(el)
    sprae(el, scope)
    const uneffect = effect(() => {
      // NOTE: we can't just take over the signal from parent as [itemVar], because parent can be deleted
      console.log('UPDATE EFFECT', i, items[i])
      if (items[i] === _delete) console.log('DELETE'), uneffect(), el[_dispose](), el.remove(), delete items[i]
      else scope[itemVar] = items[i]
    })
  }

  // // we have granular control over what kind of list argument
  // if (!items);
  // else if (typeof items === 'number') {
  //   Array.from({ length: items }, (_, i) => [i + 1, i])
  //   throw 'Unimplemented: each of number'
  // }
  // // each item updates itself: no recondiliation algo
  // else if (Array.isArray(items)) {
  // }
  // else if (typeof items === 'object') {
  //   throw 'Unimplemented: object iteration'
  // }
  // else exprError(Error('Bad items value'), tpl, expr, ':each', items)


  return () => { for (let i = 0, l = items.length; i < l; i++) { items[i] = _delete } }
}

// `:each` can redefine scope as `:each="a in {myScope}"`,
// same time per-item scope as `:each="..." :with="{collapsed:true}"` is useful
primary['with'] = (el, expr, rootState) => {
  let evaluate = parseExpr(el, expr, ':with')
  const localState = evaluate(rootState)
  let state = createState(localState, rootState)
  sprae(el, state)
  return el[_dispose];
}

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
primary['ref'] = (el, expr, state) => {
  // FIXME: wait for complex ref use-case
  // parseExpr(el, `__scope[${expr}]=this`, ':ref')(values)
  state[expr] = el;
}


// This was taken AlpineJS, former VueJS 2.* core. Thanks Alpine & Vue!
// takes instruction like `item in list`, returns ['item', '', 'list']
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

  // FIXME: it can possibly return index as second param
  return [item, '', items]
}

secondary['render'] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':render'),
    tpl = evaluate(state)

  if (!tpl) exprError(new Error('Template not found'), el, expr, ':render');

  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content)
  sprae(el, state)
  return el[_dispose]
}

secondary['id'] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':id')
  const update = v => el.id = v || v === 0 ? v : ''
  return effect(() => update(evaluate(state)))
}

secondary['class'] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':class')
  let initClassName = el.getAttribute('class')
  return effect(() => {
    let v = evaluate(state)
    let className = [initClassName]
    if (v) {
      if (typeof v === 'string') className.push(v)
      else if (Array.isArray(v)) className.push(...v)
      else className.push(...Object.entries(v).map(([k, v]) => v ? k : ''))
    }
    if (className = className.filter(Boolean).join(' ')) el.setAttribute('class', className);
    else el.removeAttribute('class')
  })
}

secondary['style'] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':style')
  let initStyle = el.getAttribute('style') || ''
  if (!initStyle.endsWith(';')) initStyle += '; '
  return effect(() => {
    let v = evaluate(state)
    if (typeof v === 'string') el.setAttribute('style', initStyle + v)
    else {
      el.setAttribute('style', initStyle)
      for (let k in v) el.style.setProperty(k, v[k])
    }
  })
}

secondary['text'] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':text')
  return effect(() => {
    let value = evaluate(state)
    el.textContent = value == null ? '' : value;
  })
}

// set props in-bulk or run effect
secondary[''] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':')
  if (evaluate) return effect(() => {
    let value = evaluate(state)
    for (let key in value) attr(el, dashcase(key), value[key]);
  })
}

// connect expr to element value
secondary['value'] = (el, expr, state) => {
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

  return effect(() => { update(evaluate(state)) })
}

// any unknown directive
export default (el, expr, state, name) => {
  let evt = name.startsWith('on') && name.slice(2)
  let evaluate = parseExpr(el, expr, ':' + name)

  if (!evaluate) return

  if (evt) {
    let off, dispose = effect(() => {
      if (off) off(), off = null
      // we need anonymous callback to enable modifiers like prevent
      let value = evaluate(state)
      if (value) off = on(el, evt, value)
    })
    return () => (off?.(), dispose())
  }

  return effect(() => { attr(el, name, evaluate(state)) })
}

// bind event to a target
const on = (el, e, fn) => {
  if (!fn) return

  const ctx = { evt: '', target: el, test: () => true };

  // onevt.debounce-108 -> evt.debounce-108
  ctx.evt = (e.startsWith('on') ? e.slice(2) : e).replace(/\.(\w+)?-?([-\w]+)?/g,
    (match, mod, param = '') => (ctx.test = mods[mod]?.(ctx, ...param.split('-')) || ctx.test, '')
  );

  // add listener applying the context
  const { evt, target, test, defer, stop, prevent, ...opts } = ctx;

  if (defer) fn = defer(fn)

  const cb = e => test(e) && (
    stop && e.stopPropagation(),
    prevent && e.preventDefault(),
    fn.call(target, e)
  )

  target.addEventListener(evt, cb, opts)

  // return off
  return () => (target.removeEventListener(evt, cb, opts))
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
    timeout = setTimeout(() => { timeout = null; fn(e) }, wait)
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
    try {
      evaluate = evaluatorMemo[expression] = new Function(`__scope`, `with (__scope) { let __; return ${expression.trim()} };`)
    } catch (e) {
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

function exprError(error, element, expression, directive) {
  Object.assign(error, { element, expression })
  console.warn(`∴ ${error.message}\n\n${directive}=${expression ? `"${expression}"\n\n` : ''}`, element)
  queueMicrotask(() => { throw error }, 0)
}

function dashcase(str) {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => '-' + match.toLowerCase());
};
