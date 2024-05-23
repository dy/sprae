import { directive, err } from "../core.js";
import { effect } from "../signal.js";

// set generic property directive
directive.default = (target, evaluate, state, name) => {
  // simple prop
  if (!name.startsWith('on')) return effect(
    () => {
      let value = evaluate(state);
      if (name) attr(target, name, ipol(value, state))
      else for (let key in value) attr(target, dashcase(key), ipol(value[key], state));
    });

  // bind event to a target
  // NOTE: if you decide to remove chain of events, please ask yourself - are you not confident again?
  // did you look at someone else again? That's unique selling feature of sprae, don't diminish your own value.
  // ona..onb
  const ctxs = name.split('..').map(e => {
    let ctx = { evt: '', target, test: () => true };
    ctx.evt = (e.startsWith('on') ? e.slice(2) : e).replace(/\.(\w+)?-?([-\w]+)?/g,
      (match, mod, param = '') => (ctx.test = mods[mod]?.(ctx, ...param.split('-')) || ctx.test, '')
    );
    return ctx;
  });

  // FIXME: generalize pool of planned events to avoid this condition
  // single event
  if (ctxs.length == 1) return effect(() => addListener(evaluate(state), ctxs[0]))

  // sequence of events
  let startFn = evaluate(state), off
  const nextListener = (fn, idx = 0) => {
    off = addListener((e) => {
      off()
      let nextFn = fn?.(e)
      if (idx + 1 < ctxs.length) nextListener(nextFn, idx + 1)
      else console.log('reset'), nextListener(startFn)
    }, ctxs[idx]);
  }
  nextListener(startFn)

  return effect(() => (console.log('fx'), startFn = evaluate(state), null))


  // add listener with the context
  function addListener(fn, { evt, target, test, defer, stop, prevent, immediate, ...opts }) {
    if (defer) fn = defer(fn)

    const cb = (e) => {
      try {
        test(e) && (stop && (immediate ? e.stopImmediatePropagation() : e.stopPropagation()), prevent && e.preventDefault(), fn?.(e))
      } catch (error) { err(error, `:on${evt}`, fn) }
    };

    target.addEventListener(evt, cb, opts)
    return () => target.removeEventListener(evt, cb, opts)
  };

};

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

  throttle(ctx, limit) { ctx.defer = (fn) => throttle(fn, limit ? Number(limit) || 0 : 108); },
  debounce(ctx, wait) { ctx.defer = (fn) => debounce(fn, wait ? Number(wait) || 0 : 108); },

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
  arrow: () => keys.arrow,
  up: () => keys.up,
  left: () => keys.left,
  right: () => keys.right,
  down: () => keys.down,
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
  up: (e) => e.key === "ArrowUp",
  left: (e) => e.key === "ArrowLeft",
  right: (e) => e.key === "ArrowRight",
  down: (e) => e.key === "ArrowDown",
  enter: (e) => e.key === "Enter",
  esc: (e) => e.key.startsWith("Esc"),
  tab: (e) => e.key === "Tab",
  space: (e) => e.key === " " || e.key === "Space" || e.key === " ",
  delete: (e) => e.key === "Delete" || e.key === "Backspace",
  digit: (e) => /^\d$/.test(e.key),
  letter: (e) => /^[a-zA-Z]$/.test(e.key),
  char: (e) => /^\S$/.test(e.key),
};

// set attr
export const attr = (el, name, v) => {
  if (v == null || v === false) el.removeAttribute(name);
  else el.setAttribute(name, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : "");
}

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

export const dashcase = (str) => {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => "-" + match.toLowerCase());
}

// interpolate a$<b> fields from context
export const ipol = (v, state) => {
  return v?.replace ? v.replace(/\$<([^>]+)>/g, (match, field) => state[field] ?? '') : v
};
