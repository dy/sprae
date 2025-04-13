import { safe } from "../core.js";

export default (target, state, expr, parts) => {
  // NOTE: if you decide to remove chain of events, think again - that's unique feature of sprae, don't diminish its value.
  // ona..onb
  let ctx, ctxs = [ ], mod, params
  for (let part of [,...parts]) {
    // empty part means next event in chain ona..onb
    if (!part) ctxs.push(ctx = {evt:'', target, test:_=>true});
    // first part means event ona.x
    else if (!ctx.evt) ctx.evt = part.slice(2)
    // rest of parts apply modifiers
    else ([mod, ...params]=part.split('-'), ctx.test = mods[mod]?.(ctx, params) || ctx.test)
  }

  // add listener with the context
  let addListener = (fn, { evt, target, test, defer, stop, prevent, immediate, ...opts }, cb) => {
    if (defer) fn = defer(fn)

    cb = safe((e) =>
      test(e) && (stop && (immediate ? e.stopImmediatePropagation() : e.stopPropagation()), prevent && e.preventDefault(), fn?.call(state, e))
    , 'on', expr);

    target.addEventListener(evt, cb, opts)
    return () => target.removeEventListener(evt, cb, opts)
  };

  // single event
  if (ctxs.length == 1) return v => addListener(v, ctxs[0])

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
    () => startFn = null // nil startFn to autodispose chain
  )
}

// event modifiers
const mods = {
  // actions
  prevent(ctx) { ctx.prevent = true; },
  stop(ctx) { ctx.stop = true; },
  immediate(ctx) { ctx.immediate = true; },

  // options
  once(ctx) { ctx.once = true; },
  passive(ctx) { ctx.passive = true; },
  capture(ctx) { ctx.capture = true; },

  // target
  window(ctx) { ctx.target = window; },
  document(ctx) { ctx.target = document; },
  parent(ctx) { ctx.target = ctx.target.parentNode; },

  throttle(ctx, limit=108) { ctx.defer = (fn) => throttle(fn, limit)},
  debounce(ctx, wait=108) { ctx.defer = (fn) => debounce(fn, wait) },

  // test
  outside: (ctx) => (e) => {
    let target = ctx.target;
    if (target.contains(e.target)) return false;
    if (e.target.isConnected === false) return false;
    if (target.offsetWidth < 1 && target.offsetHeight < 1) return false;
    return true;
  },
  self: (ctx) => (e) => e.target === ctx.target,

  // keyboard
  ctrl: (_, ...param) => (e) => keys.ctrl(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  shift: (_, ...param) => (e) => keys.shift(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  alt: (_, ...param) => (e) => keys.alt(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  meta: (_, ...param) => (e) => keys.meta(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  // NOTE: up/left/right/down would be too verbose: can and better be handled in one place
  arrow: () => keys.arrow,
  enter: () => keys.enter,
  esc: () => keys.esc,
  tab: () => keys.tab,
  space: () => keys.space,
  delete: () => keys.delete,
  digit: () => keys.digit,
  letter: () => keys.letter,
  char: () => keys.char,
};

// key testers
const keys = {
  ctrl: (e) => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: (e) => e.shiftKey || e.key === "Shift",
  alt: (e) => e.altKey || e.key === "Alt",
  meta: (e) => e.metaKey || e.key === "Meta" || e.key === "Command",
  arrow: (e) => e.key.startsWith("Arrow"),
  enter: (e) => e.key === "Enter",
  esc: (e) => e.key.startsWith("Esc"),
  tab: (e) => e.key === "Tab",
  space: (e) => e.key === " " || e.key === "Space" || e.key === " ",
  delete: (e) => e.key === "Delete" || e.key === "Backspace",
  digit: (e) => /^\d$/.test(e.key),
  letter: (e) => /^\p{L}$/gu.test(e.key),
  char: (e) => /^\S$/.test(e.key),
};

// create delayed fns
const throttle = (fn, limit) => {
  let pause, planned,
    block = (e) => {
      pause = true;
      setTimeout(() => {
        pause = false;
        // if event happened during blocked time, it schedules call by the end
        if (planned) return (planned = false), block(e), fn(e);
      }, limit);
    };
  return (e) => {
    if (pause) return (planned = true);
    block(e);
    return fn(e);
  };
};

const debounce = (fn, wait) => {
  let timeout;
  return (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(e);
    }, wait);
  };
};
