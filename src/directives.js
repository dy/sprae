// directives & parsing
import sprae from './core.js'
import createState, { effect, computed, untracked, batch, _dispose, _signals, _change } from './state.signals-proxy.js'
import { getFirstProperty, queueMicrotask } from './util.js'
import compile from './compile.js'




// reserved directives - order matters!
// primary initialized first by selector, secondary initialized by iterating attributes
export const primary = {}, secondary = {}

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :with - :if must init first, since it is lazy, to avoid initializing component ahead of time by :with
// we consider :with={x} :if={x} case insignificant
const _else = Symbol('else')
primary['if'] = (ifEl, expr, state) => {
  let holder = document.createTextNode(''),
    check = parseExpr(ifEl, expr, ':if'),
    cur, elseEl = ifEl.nextElementSibling, prevPass = ifEl[_else],
    pass = computed(() => check(state))

  ifEl.replaceWith(cur = holder)

  if (elseEl?.hasAttribute(':else')) {
    elseEl.removeAttribute(':else');
    // if next is :else :if - delegate it to own :if handler
    if (elseEl.hasAttribute(':if')) {
      elseEl[_else] = pass
      elseEl = null
    }
    else {
      elseEl.remove();
    }
  }
  else elseEl = null

  const dispose = effect(() => {
    const el = prevPass?.value ? holder : pass.value ? ifEl : elseEl
    if (cur != el) {
      (cur[_each] || cur).replaceWith(cur = el || holder);
      if (cur !== holder) sprae(cur, state);
    }
  })

  return () => {
    ifEl[_dispose]?.()
    elseEl?.[_dispose]?.()
    dispose() // dispose effect
  }
}

const _each = Symbol(':each')

// :each must init before :ref, :id or any others, since it defines scope
primary['each'] = (tpl, expr, state) => {
  const each = parseForExpression(expr);
  if (!each) return exprError(new Error, tpl, expr, ':each');

  const [itemVar, idxVar, itemsExpr] = each;

  // we have to handle item :ref separately if don't create substates
  // const refName = tpl.getAttribute(':ref') || ''
  // if (refName) tpl.removeAttribute(':ref')

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = tpl[_each] = document.createTextNode('')
  tpl.replaceWith(holder)

  const evaluate = parseExpr(tpl, itemsExpr, ':each');

  // we re-create items any time new items are produced
  let curItems, signals
  effect(() => {
    let srcItems = evaluate(state), newItems, keys
    let prevl = curItems?.length || 0

    // convert items to array
    if (!srcItems) newItems = []
    else if (typeof srcItems === 'number') newItems = Array.from({ length: srcItems }, (_, i) => i)
    else if (Array.isArray(srcItems)) newItems = srcItems;
    else if (typeof srcItems === 'object') {
      keys = Object.keys(srcItems);
      newItems = Object.values(srcItems);
      srcItems[_change]; // subscribe to object new props changes
    }
    else {
      exprError(Error('Bad items value'), tpl, expr, ':each', srcItems)
    }

    untracked(() => batch(() => {
      // (re)init items (if plain array/obj passed instead of proxy-state)
      if (!curItems || !curItems[_signals]) {
        // manual dispose for plain (non-state) arrays - signals here is just holder for destructors
        for (let i = 0; i < prevl; i++) signals[i]?._del()
        // NOTE: new items are initialized in length effect below;
        curItems = newItems, signals = curItems[_signals] || []
        if (keys) prevl = 0 // NOTE: objects regenerate full list each time instead of subscription
      }
      // patch existing items and insert new items - init happens in length effect
      else {
        let newl = newItems.length, i = 0
        for (; i < newl; i++) curItems[i] = newItems[i]
        curItems.length = newl // dispose tail (done internally in state)
      }
    }))

    // length change effect
    return effect(() => {
      let newl = newItems.length; // indicate that we track length
      if (prevl !== newl) untracked(() => batch(() => {
        // init new items
        for (let i = prevl; i < newl; i++) {
          const idx = keys?.[i] ?? i
          const el = tpl.cloneNode(true),
            // inherited object instead of substate (less memory & faster)
            // scope = Object.create(state, {
            //   [itemVar]: { get() { return curItems[i] } },
            //   [idxVar]: { value: idx },
            //   [refName]: { value: el },
            // })
            scope = createState({
              [itemVar]: signals[i] ?? curItems[i],
              [idxVar]: idx
            }, state)
          holder.before(el)
          sprae(el, scope)
          const { _del } = (signals[i] ||= {});
          signals[i]._del = () => { delete curItems[i]; _del?.(); el[_dispose](), el.remove() }
        }
        prevl = newl
      }))
    })
  })

  return () => batch(() => {
    for (let _i of signals) _i?._del()
    signals.length = 0
    curItems.length = 0
  })
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
  state[expr] = el;
}


// This was taken AlpineJS, former VueJS 2.* core. Thanks Alpine & Vue!
// takes instruction like `item in list`, returns ['item', '', 'list']
// FIXME: use subscript way
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
      else {
        className.push(...Object.entries(v).map(([k, v]) => v ? k : ''))
      }
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
      untracked(() => {
        el.setAttribute('style', initStyle)
        for (let k in v) if (typeof v[k] !== 'symbol') el.style.setProperty(k, v[k])
      })
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

// run effect
secondary[''] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ':')
  if (evaluate) return effect(() => { evaluate(state) })
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
      let cb = evaluate(state)
      if (cb) off = on(el, evt, cb)
    })
    return () => (off?.(), dispose())
  }

  // FIXME: generalize
  state = Object.create(state, { this: { value: el } })

  return effect(() => {
    // console.log(evaluate(state))
    attr(el, name, evaluate(state))
  })
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
      evaluate = evaluatorMemo[expression] = compile(expression)
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
