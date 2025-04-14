import { safe } from "../core.js";

export default (target, state, expr, parts) => {
  // ona..onb
  let ctx, ctxs = [], mod, params
  for (let part of [, ...parts]) {
    // empty part means next event in chain ona..onb
    if (!part) ctxs.push(ctx = { evt: '', target, test: _ => 1 });
    // first part means event ona.x
    else if (!ctx.evt) ctx.evt = part.slice(2)
    // rest of parts apply modifiers
    else ([mod, ...params] = part.split('-'), ctx.test = mods[mod]?.(ctx, params) || ctx.test)
  }

  // add listener with the context
  let addListener = (fn, { evt, target, test, defer, stop, prevent, immediate, ...opts }, cb) => (
    fn = defer?.(fn) ?? fn,
    cb = safe((e) =>
      test(e) && (stop && (immediate ? e.stopImmediatePropagation() : e.stopPropagation()), prevent && e.preventDefault(), fn?.call(state, e))
      , 'on', expr),

    target.addEventListener(evt, cb, opts),
    () => target.removeEventListener(evt, cb, opts)
  );

  // single event
  if (ctxs.length == 1)
    return v => addListener(v, ctxs[0])

  // events cycler
  let startFn, nextFn, off, idx = 0
  let nextListener = (fn) => {
    off = addListener((e) => (
      off(), nextFn = fn?.(e), (idx = ++idx % ctxs.length) ? nextListener(nextFn) : (startFn && nextListener(startFn))
    ), ctxs[idx]);
  }

  return value => (
    startFn = value,
    !off && nextListener(startFn),
    () => startFn = 0 // nil startFn to autodispose chain
  )
}

// event modifiers
const mods = {
  // actions
  prevent(ctx) { ctx.prevent = 1; },
  stop(ctx) { ctx.stop = 1; },
  immediate(ctx) { ctx.immediate = 1; },

  // options
  once(ctx) { ctx.once = 1; },
  passive(ctx) { ctx.passive = 1; },
  capture(ctx) { ctx.capture = 1; },

  // target
  window(ctx) { ctx.target = window; },
  document(ctx) { ctx.target = document; },
  parent(ctx) { ctx.target = ctx.target.parentNode; },

  throttle(ctx, limit = 108) { ctx.defer = (fn) => throttle(fn, limit) },
  debounce(ctx, wait = 108) { ctx.defer = (fn) => debounce(fn, wait) },

  // test
  outside: (ctx) => (e, _target) => (
    _target = ctx.target,
    !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight)
  ),
  self: (ctx) => (e) => e.target === ctx.target,
};

// key testers
const keys = {
  ctrl: e => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: e => e.shiftKey || e.key === "Shift",
  alt: e => e.altKey || e.key === "Alt",
  meta: e => e.metaKey || e.key === "Meta" || e.key === "Command",
  arrow: e => e.key.startsWith("Arrow"),
  enter: e => e.key === "Enter",
  esc: e => e.key.startsWith("Esc"),
  tab: e => e.key === "Tab",
  space: e => e.key === " " || e.key === "Space" || e.key === " ",
  delete: e => e.key === "Delete" || e.key === "Backspace",
  digit: e => /^\d$/.test(e.key),
  letter: e => /^\p{L}$/gu.test(e.key),
  char: e => /^\S$/.test(e.key),
};

// augment modifiers with key testers
for (let k in keys) mods[k] = (_, p) => e => keys[k](e) && p.every(k => keys[k]?.(e) ?? e.key === k)

// create delayed fns
const throttle = (fn, limit, _pause, _planned, _block) => (
  _block = (e) => (
    _pause = 1,
    setTimeout(() => (
      _pause = 0,
      // if event happened during blocked time, it schedules call by the end
      _planned && (_planned = 0, _block(e), fn(e))
    ), limit)
  ),
  (e) => _pause ? _planned = 1 : (_block(e), fn(e))
)

const debounce = (fn, wait, _timeout) => (e) => (
  clearTimeout(_timeout),
  _timeout = setTimeout(() => (
    _timeout = null,
    fn(e)
  ), wait)
)
