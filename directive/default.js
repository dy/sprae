import { directive, err } from "../core.js";
import { effect } from "../signal.js";

// set generic property directive
directive.default = (el, evaluate, state, name) => {
  let evt = name.startsWith("on") && name.slice(2), off
  return effect(
    evt ?
      () => (
        off?.(), // intermediate teardown
        off = on(el, evt, evaluate(state))
      ) :
      () => {
        let value = evaluate(state);
        if (name) attr(el, name, ipol(value, state))
        else for (let key in value) attr(el, dashcase(key), ipol(value[key], state));
      });
};


// bind event to a target
// NOTE: if you decide to remove chain of events, please ask yourself - are you not confident again?
// did you look at someone else again? That's unique selling feature of sprae, don't diminish your own value.
const on = (target, evt, fn = () => { }) => {
  // ona..onb
  const ctxs = evt.split('..').map(e => {
    let ctx = { evt: '', target, test: () => true };
    ctx.evt = (e.startsWith('on') ? e.slice(2) : e).replace(/\.(\w+)?-?([-\w]+)?/g,
      (match, mod, param = '') => (ctx.test = mods[mod]?.(ctx, ...param.split('-')) || ctx.test, '')
    );
    return ctx;
  });

  // single event bind
  if (ctxs.length == 1) return addListener(fn, ctxs[0])

  // events chain cycler
  const nextListener = (fn, idx = 0) => {
    let off
    return off = addListener((e) => {
      if (idx) off(); // don't remove entry listener - we must keep chain entry always open
      let nextFn = fn.call(target, e)
      if (typeof nextFn !== 'function') nextFn = () => { }
      if (idx + 1 < ctxs.length) nextListener(nextFn, idx + 1);
    }, ctxs[idx]);
  }

  return nextListener(fn)

  // add listener applying the context
  function addListener(fn, { evt, target, test, defer, stop, prevent, ...opts }) {
    if (defer) fn = defer(fn)

    const cb = (e) => {
      try {
        test(e) && (stop && e.stopPropagation(), prevent && e.preventDefault(), fn.call(target, e))
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
  enter: () => keys.enter,
  escape: () => keys.escape,
  tab: () => keys.tab,
  space: () => keys.space,
  backspace: () => keys.backspace,
  delete: () => keys.delete,
  digit: () => keys.digit,
  letter: () => keys.letter,
  character: () => keys.character,
};

// key testers
const keys = {
  ctrl: (e) => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: (e) => e.shiftKey || e.key === "Shift",
  alt: (e) => e.altKey || e.key === "Alt",
  meta: (e) => e.metaKey || e.key === "Meta" || e.key === "Command",
  arrow: (e) => e.key.startsWith("Arrow"),
  enter: (e) => e.key === "Enter",
  escape: (e) => e.key.startsWith("Esc"),
  tab: (e) => e.key === "Tab",
  space: (e) => e.key === " " || e.key === "Space" || e.key === " ",
  backspace: (e) => e.key === "Backspace",
  delete: (e) => e.key === "Delete",
  digit: (e) => /^\d$/.test(e.key),
  letter: (e) => /^[a-zA-Z]$/.test(e.key),
  character: (e) => /^\S$/.test(e.key),
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
