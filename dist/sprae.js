var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// core.js
var _dispose = Symbol.dispose ||= Symbol("dispose");
var SPRAE = `\u2234`;
var signal;
var effect;
var batch;
var computed;
var untracked;
var directive = {};
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  if (memo.has(container)) {
    const [state2, effects2] = memo.get(container);
    for (let k in values) {
      state2[k] = values[k];
    }
    untracked(() => {
      for (let fx of effects2)
        fx();
    });
  }
  const state = values || {};
  const effects = [];
  const init = (el, parent = el.parentNode) => {
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length; ) {
        let attr2 = el.attributes[i];
        if (attr2.name[0] === ":") {
          el.removeAttribute(attr2.name);
          let names = attr2.name.slice(1).split(":");
          for (let name of names) {
            let dir = directive[name] || directive.default;
            let evaluate = (dir.parse || parse)(attr2.value, parse);
            let update = dir(el, evaluate, state, name);
            if (update) {
              update[_dispose] = effect(update);
              effects.push(update);
            }
          }
          if (memo.has(el))
            return;
          if (el.parentNode !== parent)
            return false;
        } else
          i++;
      }
    }
    for (let i = 0, child; child = el.children[i]; i++) {
      if (init(child, el) === false)
        i--;
    }
  };
  init(container);
  if (memo.has(container))
    return state;
  memo.set(container, [state, effects]);
  container.classList?.add(SPRAE);
  container[_dispose] = () => {
    while (effects.length)
      effects.pop()[_dispose]();
    container.classList.remove(SPRAE);
    memo.delete(container);
    let els = container.getElementsByClassName(SPRAE);
    while (els.length)
      els[0][_dispose]?.();
  };
  return state;
}
var evalMemo = {};
var parse = (expr, dir, fn) => {
  if (fn = evalMemo[expr = expr.trim()])
    return fn;
  try {
    fn = compile(expr);
  } catch (e) {
    throw Object.assign(e, { message: `\u2234 ${e.message}

${dir}${expr ? `="${expr}"

` : ""}`, expr });
  }
  fn.expr = expr;
  return evalMemo[expr] = fn;
};
var compile;
var swap;
var ipol = (v, state) => {
  return v?.replace ? v.replace(/\$<([^>]+)>/g, (match, field) => state[field]?.valueOf?.() ?? "") : v;
};
sprae.use = (s) => {
  s.signal && (signal = s.signal, effect = s.effect, computed = s.computed, batch = s.batch || ((fn) => fn()), untracked = s.untracked || batch);
  s.swap && (swap = s.swap);
  s.compile && (compile = s.compile);
};

// signal.js
var signal_exports = {};
__export(signal_exports, {
  batch: () => batch2,
  computed: () => computed2,
  effect: () => effect2,
  signal: () => signal2,
  untracked: () => untracked2
});
var current;
var signal2 = (v, s, obs = /* @__PURE__ */ new Set()) => (s = {
  get value() {
    current?.deps.push(obs.add(current));
    return v;
  },
  set value(val) {
    if (val === v)
      return;
    v = val;
    for (let sub of obs)
      sub(val);
  },
  peek() {
    return v;
  }
}, s.toJSON = s.then = s.toString = s.valueOf = () => s.value, s);
var effect2 = (fn, teardown, run, deps) => (run = (prev) => {
  teardown?.call?.();
  prev = current, current = run;
  try {
    teardown = fn();
  } finally {
    current = prev;
  }
}, deps = run.deps = [], run(), (dep) => {
  teardown?.call?.();
  while (dep = deps.pop())
    dep.delete(run);
});
var computed2 = (fn, s = signal2(), c, e) => (c = {
  get value() {
    e ||= effect2(() => s.value = fn());
    return s.value;
  },
  peek: s.peek
}, c.toJSON = c.then = c.toString = c.valueOf = () => c.value, c);
var batch2 = (fn) => fn();
var untracked2 = (fn, prev, v) => (prev = current, current = null, v = fn(), current = prev, v);

// node_modules/swapdom/deflate.js
var swap2 = (parent, a, b, end = null, { remove, insert } = swap2) => {
  let i = 0, cur, next, bi, bidx = new Set(b);
  while (bi = a[i++])
    !bidx.has(bi) ? remove(bi, parent) : cur = cur || bi;
  cur = cur || end, i = 0;
  while (bi = b[i++]) {
    next = cur ? cur.nextSibling : end;
    if (cur === bi)
      cur = next;
    else {
      if (b[i] === next)
        cur = next;
      insert(bi, cur, parent);
    }
  }
  return b;
};
swap2.insert = (a, b, parent) => parent.insertBefore(a, b);
swap2.remove = (a, parent) => parent.removeChild(a);
var deflate_default = swap2;

// directive/each.js
var _each = Symbol(":each");
var keys = {};
var _key = Symbol("key");
(directive.each = (tpl, [itemVar, idxVar, evaluate], state) => {
  const holder = tpl[_each] = document.createTextNode(""), parent = tpl.parentNode;
  tpl.replaceWith(holder);
  const elCache = /* @__PURE__ */ new WeakMap(), stateCache = /* @__PURE__ */ new WeakMap();
  let cur = [];
  const remove = (el) => {
    el.remove();
    el[Symbol.dispose]?.();
    if (el[_key]) {
      elCache.delete(el[_key]);
      stateCache.delete(el[_key]);
    }
  }, { insert, replace } = swap;
  const options = { remove, insert, replace };
  return () => {
    let items = evaluate(state)?.valueOf(), els = [];
    if (typeof items === "number")
      items = Array.from({ length: items }, (_, i) => i);
    const count = /* @__PURE__ */ new WeakMap();
    for (let idx in items) {
      let el, item = items[idx], key = item?.key ?? item?.id ?? item ?? idx;
      key = Object(key) !== key ? keys[key] ||= Object(key) : item;
      if (key == null || count.has(key) || tpl.content)
        el = (tpl.content || tpl).cloneNode(true);
      else
        count.set(key, 1), (el = elCache.get(key) || (elCache.set(key, tpl.cloneNode(true)), elCache.get(key)))[_key] = key;
      let substate = stateCache.get(key) || (stateCache.set(key, Object.create(state, { [idxVar]: { value: idx } })), stateCache.get(key));
      substate[itemVar] = item;
      sprae(el, substate);
      if (el.nodeType === 11)
        els.push(...el.childNodes);
      else
        els.push(el);
    }
    swap(parent, cur, cur = els, holder, options);
  };
}).parse = (expr, parse2) => {
  let [leftSide, itemsExpr] = expr.split(/\s+in\s+/);
  let [itemVar, idxVar = "$"] = leftSide.split(/\s*,\s*/);
  return [itemVar, idxVar, parse2(itemsExpr)];
};

// directive/if.js
var _prevIf = Symbol("if");
directive.if = (ifEl, evaluate, state) => {
  let parent = ifEl.parentNode, next = ifEl.nextElementSibling, holder = document.createTextNode(""), cur, ifs, elses, none = [];
  ifEl.after(holder);
  if (ifEl.content)
    cur = none, ifEl.remove(), ifs = [...ifEl.content.childNodes];
  else
    ifs = cur = [ifEl];
  if (next?.hasAttribute(":else")) {
    next.removeAttribute(":else");
    if (next.hasAttribute(":if"))
      elses = none;
    else
      next.remove(), elses = next.content ? [...next.content.childNodes] : [next];
  } else
    elses = none;
  return () => {
    const newEls = evaluate(state)?.valueOf() ? ifs : ifEl[_prevIf] ? none : elses;
    if (next)
      next[_prevIf] = newEls === ifs;
    if (cur != newEls) {
      if (cur[0]?.[_each])
        cur = [cur[0][_each]];
      swap(parent, cur, cur = newEls, holder);
      for (let el of cur)
        sprae(el, state);
    }
  };
};

// directive/ref.js
(directive.ref = (el, expr, state) => {
  let prev;
  return () => {
    if (prev)
      delete state[prev];
    state[prev = ipol(expr, state)] = el;
  };
}).parse = (expr) => expr;

// directive/scope.js
directive.scope = (el, evaluate, rootState) => {
  return () => {
    sprae(el, { ...rootState, ...evaluate(rootState)?.valueOf?.() || {} });
  };
};

// directive/html.js
directive.html = (el, evaluate, state) => {
  let tpl = evaluate(state);
  if (!tpl)
    return;
  let content = (tpl.content || tpl).cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
};

// directive/text.js
directive.text = (el, evaluate, state) => {
  if (el.content)
    el.replaceWith(el = document.createTextNode(""));
  return () => {
    let value = evaluate(state)?.valueOf();
    el.textContent = value == null ? "" : value;
  };
};

// directive/class.js
directive.class = (el, evaluate, state) => {
  let cur = /* @__PURE__ */ new Set();
  return () => {
    let v = evaluate(state);
    let clsx = /* @__PURE__ */ new Set();
    if (v) {
      if (typeof v === "string")
        ipol(v?.valueOf?.(), state).split(" ").map((cls) => clsx.add(cls));
      else if (Array.isArray(v))
        v.map((v2) => (v2 = ipol(v2?.valueOf?.(), state)) && clsx.add(v2));
      else
        Object.entries(v).map(([k, v2]) => v2?.valueOf?.() && clsx.add(k));
    }
    for (let cls of cur)
      if (clsx.has(cls))
        clsx.delete(cls);
      else
        el.classList.remove(cls);
    for (let cls of cur = clsx)
      el.classList.add(cls);
  };
};

// directive/style.js
directive.style = (el, evaluate, state) => {
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";"))
    initStyle += "; ";
  return () => {
    let v = evaluate(state)?.valueOf();
    if (typeof v === "string")
      el.setAttribute("style", initStyle + ipol(v, state));
    else {
      el.setAttribute("style", initStyle);
      for (let k in v)
        el.style.setProperty(k, ipol(v[k], state));
    }
  };
};

// directive/default.js
directive.default = (el, evaluate, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  if (evt) {
    let off;
    return () => (off?.(), off = on(el, evt, evaluate(state)?.valueOf()));
  }
  return () => {
    let value = evaluate(state)?.valueOf();
    if (name)
      attr(el, name, ipol(value, state));
    else
      for (let key in value)
        attr(el, dashcase(key), ipol(value[key], state));
  };
};
var on = (el, e, fn = () => {
}) => {
  const ctx = { evt: "", target: el, test: () => true };
  ctx.evt = e.replace(
    /\.(\w+)?-?([-\w]+)?/g,
    (match, mod, param = "") => (ctx.test = mods[mod]?.(ctx, ...param.split("-")) || ctx.test, "")
  );
  const { evt, target, test, defer, stop, prevent, ...opts } = ctx;
  if (defer)
    fn = defer(fn);
  const cb = (e2) => test(e2) && (stop && e2.stopPropagation(), prevent && e2.preventDefault(), fn.call(target, e2));
  target.addEventListener(evt, cb, opts);
  return () => target.removeEventListener(evt, cb, opts);
};
var mods = {
  prevent(ctx) {
    ctx.prevent = true;
  },
  stop(ctx) {
    ctx.stop = true;
  },
  once(ctx) {
    ctx.once = true;
  },
  passive(ctx) {
    ctx.passive = true;
  },
  capture(ctx) {
    ctx.capture = true;
  },
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
  outside: (ctx) => (e) => {
    let target = ctx.target;
    if (target.contains(e.target))
      return false;
    if (e.target.isConnected === false)
      return false;
    if (target.offsetWidth < 1 && target.offsetHeight < 1)
      return false;
    return true;
  },
  self: (ctx) => (e) => e.target === ctx.target,
  ctrl: (_, ...param) => (e) => keys2.ctrl(e) && param.every((p) => keys2[p] ? keys2[p](e) : e.key === p),
  shift: (_, ...param) => (e) => keys2.shift(e) && param.every((p) => keys2[p] ? keys2[p](e) : e.key === p),
  alt: (_, ...param) => (e) => keys2.alt(e) && param.every((p) => keys2[p] ? keys2[p](e) : e.key === p),
  meta: (_, ...param) => (e) => keys2.meta(e) && param.every((p) => keys2[p] ? keys2[p](e) : e.key === p),
  arrow: () => keys2.arrow,
  enter: () => keys2.enter,
  escape: () => keys2.escape,
  tab: () => keys2.tab,
  space: () => keys2.space,
  backspace: () => keys2.backspace,
  delete: () => keys2.delete,
  digit: () => keys2.digit,
  letter: () => keys2.letter,
  character: () => keys2.character
};
var keys2 = {
  ctrl: (e) => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: (e) => e.shiftKey || e.key === "Shift",
  alt: (e) => e.altKey || e.key === "Alt",
  meta: (e) => e.metaKey || e.key === "Meta" || e.key === "Command",
  arrow: (e) => e.key.startsWith("Arrow"),
  enter: (e) => e.key === "Enter",
  escape: (e) => e.key.startsWith("Esc"),
  tab: (e) => e.key === "Tab",
  space: (e) => e.key === "\xA0" || e.key === "Space" || e.key === " ",
  backspace: (e) => e.key === "Backspace",
  delete: (e) => e.key === "Delete",
  digit: (e) => /^\d$/.test(e.key),
  letter: (e) => /^[a-zA-Z]$/.test(e.key),
  character: (e) => /^\S$/.test(e.key)
};
var attr = (el, name, v) => {
  if (v == null || v === false)
    el.removeAttribute(name);
  else
    el.setAttribute(name, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : "");
};
var throttle = (fn, limit) => {
  let pause, planned, block = (e) => {
    pause = true;
    setTimeout(() => {
      pause = false;
      if (planned)
        return planned = false, block(e), fn(e);
    }, limit);
  };
  return (e) => {
    if (pause)
      return planned = true;
    block(e);
    return fn(e);
  };
};
var debounce = (fn, wait) => {
  let timeout;
  return (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(e);
    }, wait);
  };
};
var dashcase = (str) => {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => "-" + match.toLowerCase());
};

// directive/value.js
directive.value = (el, evaluate, state) => {
  let from, to;
  let update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value) => (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to)) : el.type === "checkbox" ? (value) => (el.checked = value, attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
    for (let option in el.options)
      option.removeAttribute("selected");
    el.value = value;
    el.selectedOptions[0]?.setAttribute("selected", "");
  } : (value) => el.value = value;
  return () => update(evaluate(state)?.valueOf?.());
};

// directive/fx.js
directive.fx = (el, evaluate, state) => {
  return () => evaluate(state);
};

// sprae.js
sprae.use(signal_exports);
sprae.use({ compile: (expr) => sprae.constructor(`__scope`, `with (__scope) { return ${expr} };`) });
sprae.use({ swap: deflate_default });
var sprae_default = sprae;
export {
  batch,
  computed,
  sprae_default as default,
  effect,
  signal,
  untracked
};
