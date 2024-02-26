// directives & parsing
import sprae, { _dispose } from "./core.js";
import { signal, effect, computed } from "./core.js";
import justin from "./compile.js";
import swapdom from "swapdom/swap-inflate.js";


// any unknown (default) directive
export default (el, expr, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parse(el, expr, ":" + name);

  if (!evaluate) return;

  if (evt) {
    let off,
      dispose = effect(() => {
        if (off) off(), (off = null);
        // we need anonymous callback to enable modifiers like prevent
        off = on(el, evt, evaluate(state));
      });
    return () => (off?.(), dispose());
  }

  return effect(() => {
    attr(el, name, evaluate(state));
  });
};

// reserved directives - order matters!
// primary initialized first by selector, secondary initialized by iterating attributes
export const directive = {};

// :if is interchangeable with :each depending on order, :if :each or :each :if have different meanings
// as for :if :scope - :if must init first, since it is lazy, to avoid initializing component ahead of time by :scope
// we consider :scope={x} :if={x} case insignificant
const _else = Symbol("else");
directive.if = (ifEl, expr, state, name) => {
  let holder = document.createTextNode(""),
    check = parse(ifEl, expr, name),
    cur,
    elseEl = ifEl.nextElementSibling,
    prevPass = ifEl[_else],
    pass = computed(() => check(state));

  ifEl.replaceWith((cur = holder));

  if (elseEl?.hasAttribute(":else")) {
    elseEl.removeAttribute(":else");
    // if next is :else :if - delegate it to own :if handler
    if (elseEl.hasAttribute(":if")) {
      elseEl[_else] = pass;
      elseEl = null;
    } else {
      elseEl.remove();
    }
  } else elseEl = null;

  const dispose = effect(() => {
    const el = prevPass?.value ? holder : pass.value ? ifEl : elseEl;
    if (cur != el) {
      (cur[_each] || cur).replaceWith((cur = el || holder));
      if (cur !== holder) sprae(cur, state);
    }
  });

  return () => {
    ifEl[_dispose]?.();
    elseEl?.[_dispose]?.();
    dispose(); // dispose effect
  };
};

const _each = Symbol(":each");

// :each must init before :ref, :id or any others, since it defines scope
directive.each = (tpl, expr, state, name) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = ""] = leftSide.split(/\s*,\s*/);

  // we need :if to be able to replace holder instead of tpl for :if :each case
  const holder = (tpl[_each] = document.createTextNode(""));
  tpl.replaceWith(holder);

  const evaluate = parse(tpl, itemsExpr, name);

  let cur = [];
  return effect(() => {
    // naive approach: whenever items change we replace full list
    let items = evaluate(state), els = [];
    if (typeof items === "number") items = Array.from({ length: items }, (_, i) => i);

    // FIXME: keep prev items (avoid reinit)
    // FIXME: nadi fail here without untracked
    // untracked(() => {
    for (let idx in items) {
      let el = tpl.cloneNode(true),
        substate = Object.create(state, {
          [itemVar]: { value: items[idx] },
          [idxVar]: { value: idx },
        });
      sprae(el, substate);
      els.push(el);
    }
    // })

    swapdom(holder.parentNode, cur, els, holder);
    cur = els;
  });
};

// `:each` can redefine scope as `:each="a in {myScope}"`,
// same time per-item scope as `:each="..." :scope="{collapsed:true}"` is useful
directive.scope = (el, expr, rootState, name) => {
  let evaluate = parse(el, expr, name);
  const localState = evaluate(rootState);
  // we convert all local values to signals, since we may want to update them reactively
  const state = Object.assign(Object.create(rootState), toSignal(localState));
  sprae(el, state);
  return el[_dispose];
};
const toSignal = (state) => {
  for (let key in state) {
    let v = state[key];
    if (Object(v) === v) !v.peek ? toSignal(v) : null;
    else state[key] = signal(v);
  }
  return state;
};

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  state[expr] = el;
};

directive.html = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name), tpl = evaluate(state);

  if (!tpl) err(new Error("Template not found"), el, expr, name);

  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
  return el[_dispose];
};

directive.id = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name);
  const update = (v) => (el.id = v || v === 0 ? v : "");
  return effect(() => update(evaluate(state)));
};

directive.class = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name);
  let initClassName = el.getAttribute("class"); // .className can be SVGAnimatedString da heck
  return effect(() => {
    let v = evaluate(state);
    let className = [initClassName];
    if (v) {
      if (typeof v === "string") className.push(v);
      else if (Array.isArray(v)) className.push(...v);
      else {
        className.push(...Object.entries(v).map(([k, v]) => (v ? k : "")));
      }
    }
    if ((className = className.filter(Boolean).join(" "))) el.setAttribute("class", className);
    else el.removeAttribute("class");
  });
};

directive.style = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name);
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";")) initStyle += "; ";
  return effect(() => {
    let v = evaluate(state);
    if (typeof v === "string") el.setAttribute("style", initStyle + v);
    else {
      el.setAttribute("style", initStyle);
      for (let k in v) el.style.setProperty(k, v[k]);
    }
  });
};

// set text content
directive.text = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name);
  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};

// spread props
directive[''] = (el, expr, state) => {
  let evaluate = parse(el, expr);
  if (evaluate)
    return effect(() => {
      let value = evaluate(state);
      for (let key in value) attr(el, dashcase(key), value[key]);
    });
};

directive.fx = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name);
  if (evaluate)
    return effect(() => {
      evaluate(state);
    });
};

// connect expr to element value
directive.value = (el, expr, state, name) => {
  let evaluate = parse(el, expr, name);

  let from, to;
  let update = el.type === "text" || el.type === ""
    ? (value) => el.setAttribute("value", (el.value = value == null ? "" : value))
    : el.tagName === "TEXTAREA" || el.type === "text" || el.type === ""
      ? (value) =>
      (
        // we retain selection in input
        (from = el.selectionStart),
        (to = el.selectionEnd),
        el.setAttribute("value", (el.value = value == null ? "" : value)),
        from && el.setSelectionRange(from, to)
      )
      : el.type === "checkbox"
        ? (value) => ((el.value = value ? "on" : ""), attr(el, "checked", value))
        : el.type === "select-one"
          ? (value) => {
            for (let option in el.options) option.removeAttribute("selected");
            el.value = value;
            el.selectedOptions[0]?.setAttribute("selected", "");
          }
          : (value) => (el.value = value);

  return effect(() => {
    update(evaluate(state));
  });
};

// bind event to a target
const on = (el, e, fn = () => { }) => {
  const ctx = { evt: "", target: el, test: () => true };

  // onevt.debounce-108 -> evt.debounce-108
  ctx.evt = e.replace(
    /\.(\w+)?-?([-\w]+)?/g,
    (match, mod, param = "") => ((ctx.test = mods[mod]?.(ctx, ...param.split("-")) || ctx.test), ""),
  );

  // add listener applying the context
  const { evt, target, test, defer, stop, prevent, ...opts } = ctx;

  if (defer) fn = defer(fn);

  const cb = (e) =>
    test(e) && (stop && e.stopPropagation(), prevent && e.preventDefault(), fn.call(target, e));

  target.addEventListener(evt, cb, opts);

  // return off
  return () => target.removeEventListener(evt, cb, opts);
};

// event modifiers
const mods = {
  // actions
  prevent(ctx) {
    ctx.prevent = true;
  },
  stop(ctx) {
    ctx.stop = true;
  },

  // options
  once(ctx) {
    ctx.once = true;
  },
  passive(ctx) {
    ctx.passive = true;
  },
  capture(ctx) {
    ctx.capture = true;
  },

  // target
  window(ctx) {
    ctx.target = window;
  },
  document(ctx) {
    ctx.target = document;
  },

  throttle(ctx, limit) {
    ctx.defer = (fn) => throttle(fn, limit ? Number(limit) || 0 : 108);
  },
  debounce(ctx, wait) {
    ctx.defer = (fn) => debounce(fn, wait ? Number(wait) || 0 : 108);
  },

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
  ctrl:
    (ctx, ...param) =>
      (e) =>
        keys.ctrl(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  shift:
    (ctx, ...param) =>
      (e) =>
        keys.shift(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  alt:
    (ctx, ...param) =>
      (e) =>
        keys.alt(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
  meta:
    (ctx, ...param) =>
      (e) =>
        keys.meta(e) && param.every((p) => (keys[p] ? keys[p](e) : e.key === p)),
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

// create delayed fns
const throttle = (fn, limit) => {
  let pause,
    planned,
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

// set attr
const attr = (el, name, v) => {
  if (v == null || v === false) el.removeAttribute(name);
  else el.setAttribute(name, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : "");
};

const evaluatorMemo = {};
function parse(el, expression, dir) {
  // guard static-time eval errors
  let evaluate = evaluatorMemo[expression];

  if (!evaluate) {
    try {
      evaluate = evaluatorMemo[expression] = justin(expression);
    } catch (e) {
      return err(e, el, expression, dir);
    }
  }

  // guard runtime eval errors
  return (state) => {
    let result;
    try {
      result = evaluate(state);
    } catch (e) {
      return err(e, el, expression, dir);
    }
    return result;
  };
}

function err(error, element, expression, directive) {
  Object.assign(error, { element, expression });
  console.warn(`∴ ${error.message}\n\n${directive}=${expression ? `"${expression}"\n\n` : ""}`, element);
  throw error;
}

function dashcase(str) {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => "-" + match.toLowerCase());
}
