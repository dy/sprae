// src/util.js
var queueMicrotask = Promise.prototype.then.bind(Promise.resolve());
var refs = /* @__PURE__ */ new WeakMap();
var set = (value) => {
  const ref = new WeakRef(value);
  refs.set(value, ref);
  return ref;
};
var get = (value) => refs.get(value) || set(value);
var WeakishMap = class extends Map {
  #registry = new FinalizationRegistry((key) => super.delete(key));
  get size() {
    return [...this].length;
  }
  constructor(entries = []) {
    super();
    for (const [key, value] of entries)
      this.set(key, value);
  }
  get(key) {
    return super.get(key)?.deref();
  }
  set(key, value) {
    let ref = super.get(key);
    if (ref)
      this.#registry.unregister(ref);
    ref = get(value);
    this.#registry.register(value, key, ref);
    return super.set(key, ref);
  }
};

// src/state.js
var currentFx;
var batch = /* @__PURE__ */ new Set();
var pendingUpdate;
var targetFxs = /* @__PURE__ */ new WeakMap();
var targetProxy = /* @__PURE__ */ new WeakMap();
var proxyTarget = /* @__PURE__ */ new WeakMap();
var _parent = Symbol("parent");
var sandbox = {
  Array,
  Object,
  Number,
  String,
  Boolean,
  Date,
  console,
  window,
  document,
  history,
  location
};
var handler = {
  has() {
    return true;
  },
  get(target, prop) {
    if (typeof prop === "symbol")
      return target[prop];
    if (!(prop in target))
      return target[_parent]?.[prop];
    if (prop in Object.prototype || Array.isArray(target) && prop in Array.prototype && prop !== "length")
      return target[prop];
    let value = target[prop];
    if (currentFx) {
      let propFxs = targetFxs.get(target);
      if (!propFxs)
        targetFxs.set(target, propFxs = {});
      if (!propFxs[prop])
        propFxs[prop] = [currentFx];
      else if (!propFxs[prop].includes(currentFx))
        propFxs[prop].push(currentFx);
    }
    if (value && value.constructor === Object || Array.isArray(value)) {
      let proxy = targetProxy.get(value);
      if (!proxy)
        targetProxy.set(value, proxy = new Proxy(value, handler));
      return proxy;
    }
    return value;
  },
  set(target, prop, value) {
    if (!(prop in target) && (target[_parent] && prop in target[_parent]))
      return target[_parent][prop] = value;
    if (!Array.isArray(target) && Object.is(target[prop], value))
      return true;
    target[prop] = value;
    let propFxs = targetFxs.get(target)?.[prop];
    if (propFxs)
      for (let fx2 of propFxs)
        batch.add(fx2);
    planUpdate();
    return true;
  },
  deleteProperty(target, prop) {
    target[prop] = void 0;
    delete target[prop];
    return true;
  }
};
var state = (obj, parent) => {
  if (targetProxy.has(obj))
    return targetProxy.get(obj);
  if (proxyTarget.has(obj))
    return obj;
  let proxy = new Proxy(obj, handler);
  targetProxy.set(obj, proxy);
  proxyTarget.set(proxy, obj);
  obj[_parent] = parent ? state(parent) : sandbox;
  return proxy;
};
var fx = (fn) => {
  const call = () => {
    let prev = currentFx;
    currentFx = call;
    fn();
    currentFx = prev;
  };
  call();
  return call;
};
var planUpdate = () => {
  if (!pendingUpdate) {
    pendingUpdate = true;
    queueMicrotask(() => {
      for (let fx2 of batch)
        fx2.call();
      batch.clear();
      pendingUpdate = false;
    });
  }
};

// src/domdiff.js
function domdiff_default(parent, a, b, before) {
  const aIdx = /* @__PURE__ */ new Map();
  const bIdx = /* @__PURE__ */ new Map();
  let i;
  let j;
  for (i = 0; i < a.length; i++) {
    aIdx.set(a[i], i);
  }
  for (i = 0; i < b.length; i++) {
    bIdx.set(b[i], i);
  }
  for (i = j = 0; i !== a.length || j !== b.length; ) {
    var aElm = a[i], bElm = b[j];
    if (aElm === null) {
      i++;
    } else if (b.length <= j) {
      parent.removeChild(a[i]);
      i++;
    } else if (a.length <= i) {
      parent.insertBefore(bElm, a[i] || before);
      j++;
    } else if (aElm === bElm) {
      i++;
      j++;
    } else {
      var curElmInNew = bIdx.get(aElm);
      var wantedElmInOld = aIdx.get(bElm);
      if (curElmInNew === void 0) {
        parent.removeChild(a[i]);
        i++;
      } else if (wantedElmInOld === void 0) {
        parent.insertBefore(
          bElm,
          a[i] || before
        );
        j++;
      } else {
        parent.insertBefore(
          a[wantedElmInOld],
          a[i] || before
        );
        a[wantedElmInOld] = null;
        if (wantedElmInOld > i + 1)
          i++;
        j++;
      }
    }
  }
  return b;
}

// src/directives.js
var primary = {};
var secondary = {};
primary["if"] = (el, expr) => {
  let holder = document.createTextNode(""), clauses = [parseExpr(el, expr, ":if")], els = [el], cur = el;
  while (cur = el.nextElementSibling) {
    if (cur.hasAttribute(":else")) {
      cur.removeAttribute(":else");
      if (expr = cur.getAttribute(":if")) {
        cur.removeAttribute(":if"), cur.remove();
        els.push(cur);
        clauses.push(parseExpr(el, expr, ":else :if"));
      } else {
        cur.remove();
        els.push(cur);
        clauses.push(() => 1);
      }
    } else
      break;
  }
  el.replaceWith(cur = holder);
  return (state2) => {
    let i = clauses.findIndex((f) => f(state2));
    if (els[i] != cur) {
      ;
      (cur[_each] || cur).replaceWith(cur = els[i] || holder);
      sprae(cur, state2);
    }
  };
};
primary["with"] = (el, expr, rootState) => {
  let evaluate = parseExpr(el, expr, ":with");
  const localState = evaluate(rootState);
  let state2 = state(localState, rootState);
  sprae(el, state2);
};
var _each = Symbol(":each");
primary["each"] = (tpl, expr) => {
  let each = parseForExpression(expr);
  if (!each)
    return exprError(new Error(), tpl, expr, ":each");
  const holder = tpl[_each] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = parseExpr(tpl, each[2], ":each");
  const keyExpr = tpl.getAttribute(":key");
  const itemKey = keyExpr ? parseExpr(null, keyExpr, ":each") : null;
  tpl.removeAttribute(":key");
  const refExpr = tpl.getAttribute(":ref");
  const scopes = new WeakishMap();
  const itemEls = new WeakishMap();
  let curEls = [];
  return (state2) => {
    let list = evaluate(state2);
    if (!list)
      list = [];
    else if (typeof list === "number")
      list = Array.from({ length: list }, (_, i) => [i, i + 1]);
    else if (Array.isArray(list))
      list = list.map((item, i) => [i + 1, item]);
    else if (typeof list === "object")
      list = Object.entries(list);
    else
      exprError(Error("Bad list value"), tpl, expr, ":each", list);
    let newEls = [], elScopes = [];
    for (let [idx, item] of list) {
      let el, scope, key = itemKey?.({ [each[0]]: item, [each[1]]: idx });
      if (key == null)
        el = tpl.cloneNode(true);
      else
        (el = itemEls.get(key)) || itemEls.set(key, el = tpl.cloneNode(true));
      newEls.push(el);
      if (key == null || !(scope = scopes.get(key))) {
        scope = state({ [each[0]]: item, [refExpr || ""]: null, [each[1]]: idx }, state2);
        if (key != null)
          scopes.set(key, scope);
      } else
        scope[each[0]] = item;
      elScopes.push(scope);
    }
    domdiff_default(holder.parentNode, curEls, newEls, holder);
    curEls = newEls;
    for (let i = 0; i < newEls.length; i++) {
      sprae(newEls[i], elScopes[i]);
    }
  };
};
primary["ref"] = (el, expr, state2) => {
  state2[expr] = el;
};
function parseForExpression(expression) {
  let forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;
  let stripParensRE = /^\s*\(|\)\s*$/g;
  let forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
  let inMatch = expression.match(forAliasRE);
  if (!inMatch)
    return;
  let items = inMatch[2].trim();
  let item = inMatch[1].replace(stripParensRE, "").trim();
  let iteratorMatch = item.match(forIteratorRE);
  if (iteratorMatch)
    return [
      item.replace(forIteratorRE, "").trim(),
      iteratorMatch[1].trim(),
      items
    ];
  return [item, "", items];
}
secondary["render"] = (el, expr, state2) => {
  let evaluate = parseExpr(el, expr, ":render"), tpl = evaluate(state2);
  if (!tpl)
    exprError(new Error("Template not found"), el, expr, ":render");
  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state2);
};
secondary["id"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":id");
  const update = (v) => el.id = v || v === 0 ? v : "";
  return (state2) => update(evaluate(state2));
};
secondary["class"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":class");
  let initClassName = el.getAttribute("class");
  return (state2) => {
    let v = evaluate(state2);
    let className = typeof v === "string" ? v : (Array.isArray(v) ? v : Object.entries(v).map(([k, v2]) => v2 ? k : "")).filter(Boolean).join(" ");
    el.setAttribute("class", [initClassName, className].filter(Boolean).join(" "));
  };
};
secondary["style"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":style");
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";"))
    initStyle += "; ";
  return (state2) => {
    let v = evaluate(state2);
    if (typeof v === "string")
      el.setAttribute("style", initStyle + v);
    else {
      el.setAttribute("style", initStyle);
      for (let k in v)
        el.style.setProperty(k, v[k]);
    }
  };
};
secondary["text"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":text");
  return (state2) => {
    let value = evaluate(state2);
    el.textContent = value == null ? "" : value;
  };
};
secondary[""] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":");
  if (evaluate)
    return (state2) => {
      let value = evaluate(state2);
      for (let key in value)
        attr(el, dashcase(key), value[key]);
    };
};
secondary["value"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":value");
  let from, to;
  let update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value) => (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to)) : el.type === "checkbox" ? (value) => (el.value = value ? "on" : "", attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
    for (let option in el.options)
      option.removeAttribute("selected");
    el.value = value;
    el.selectedOptions[0]?.setAttribute("selected", "");
  } : (value) => el.value = value;
  return (state2) => update(evaluate(state2));
};
secondary["on"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":on");
  return (state2) => {
    let listeners = evaluate(state2);
    let offs = [];
    for (let evt in listeners)
      offs.push(on(el, evt, listeners[evt]));
    return () => {
      for (let off of offs)
        off();
    };
  };
};
var directives_default = (el, expr, state2, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parseExpr(el, expr, ":" + name);
  if (!evaluate)
    return;
  if (evt)
    return (state3) => {
      let value = evaluate(state3) || (() => {
      });
      return on(el, evt, value);
    };
  return (state3) => attr(el, name, evaluate(state3));
};
var on = (target, evt, origFn) => {
  if (!origFn)
    return;
  let ctxs = evt.split("..").map((e) => {
    let ctx = { evt: "", target, test: () => true };
    ctx.evt = (e.startsWith("on") ? e.slice(2) : e).replace(
      /\.(\w+)?-?([-\w]+)?/g,
      (match, mod, param = "") => (ctx.test = mods[mod]?.(ctx, ...param.split("-")) || ctx.test, "")
    );
    return ctx;
  });
  if (ctxs.length == 1)
    return addListenerWithMods(origFn, ctxs[0]);
  const onFn = (fn, cur = 0) => {
    let off;
    let curListener = (e) => {
      if (cur)
        off();
      let nextFn = fn.call(target, e);
      if (typeof nextFn !== "function")
        nextFn = () => {
        };
      if (cur + 1 < ctxs.length)
        onFn(nextFn, !cur ? 1 : cur + 1);
    };
    return off = addListenerWithMods(curListener, ctxs[cur]);
  };
  let rootOff = onFn(origFn);
  return () => rootOff();
  function addListenerWithMods(fn, { evt: evt2, target: target2, test, defer, stop, prevent, ...opts }) {
    if (defer)
      fn = defer(fn);
    let cb = (e) => test(e) && (stop && e.stopPropagation(), prevent && e.preventDefault(), fn.call(target2, e));
    target2.addEventListener(evt2, cb, opts);
    return () => target2.removeEventListener(evt2, cb, opts);
  }
  ;
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
  toggle(ctx) {
    ctx.defer = (fn, out) => (e) => out ? (out.call?.(ctx.target, e), out = null) : out = fn();
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
  ctrl: (ctx, ...param) => (e) => keys.ctrl(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  shift: (ctx, ...param) => (e) => keys.shift(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  alt: (ctx, ...param) => (e) => keys.alt(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  meta: (ctx, ...param) => (e) => keys.meta(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  arrow: (ctx) => keys.arrow,
  enter: (ctx) => keys.enter,
  escape: (ctx) => keys.escape,
  tab: (ctx) => keys.tab,
  space: (ctx) => keys.space,
  backspace: (ctx) => keys.backspace,
  delete: (ctx) => keys.delete,
  digit: (ctx) => keys.digit,
  letter: (ctx) => keys.letter,
  character: (ctx) => keys.character
};
var keys = {
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
var attr = (el, name, v) => {
  if (v == null || v === false)
    el.removeAttribute(name);
  else
    el.setAttribute(name, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : "");
};
var evaluatorMemo = {};
function parseExpr(el, expression, dir) {
  let evaluate = evaluatorMemo[expression];
  if (!evaluate) {
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /\b(let|const)\s/.test(expression) && !dir.startsWith(":on") ? `(() => {${expression}})()` : expression;
    try {
      evaluate = evaluatorMemo[expression] = new Function(`__scope`, `with (__scope) { return ${rightSideSafeExpression.trim()} };`);
    } catch (e) {
      return exprError(e, el, expression, dir);
    }
  }
  return (state2) => {
    let result;
    try {
      result = evaluate.call(el, state2);
    } catch (e) {
      return exprError(e, el, expression, dir);
    }
    return result;
  };
}
function exprError(error, element, expression, directive) {
  Object.assign(error, { element, expression });
  console.warn(`\u2234 ${error.message}

${directive}=${expression ? `"${expression}"

` : ""}`, element);
  queueMicrotask(() => {
    throw error;
  }, 0);
}
function dashcase(str) {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => "-" + match.toLowerCase());
}

// src/core.js
sprae.globals = sandbox;
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  if (memo.has(container))
    return Object.assign(memo.get(container), values);
  const state2 = state(values || {});
  const updates = [];
  const init = (el, parent = el.parentNode) => {
    for (let name in primary) {
      let attrName = ":" + name;
      if (el.hasAttribute?.(attrName)) {
        let expr = el.getAttribute(attrName);
        el.removeAttribute(attrName);
        updates.push(primary[name](el, expr, state2, name));
        if (memo.has(el))
          return;
        if (el.parentNode !== parent)
          return false;
      }
    }
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length; ) {
        let attr2 = el.attributes[i];
        if (attr2.name[0] !== ":") {
          i++;
          continue;
        }
        el.removeAttribute(attr2.name);
        let expr = attr2.value;
        let attrNames = attr2.name.slice(1).split(":");
        for (let attrName of attrNames) {
          let dir = secondary[attrName] || directives_default;
          updates.push(dir(el, expr, state2, attrName));
        }
      }
    }
    for (let i = 0, child; child = el.children[i]; i++) {
      if (init(child, el) === false)
        i--;
    }
  };
  init(container);
  for (let update of updates)
    if (update) {
      let teardown;
      fx(() => {
        if (typeof teardown === "function")
          teardown();
        teardown = update(state2);
      });
    }
  memo.set(container, state2);
  return state2;
}

// src/index.js
var src_default = sprae;
if (document.currentScript)
  sprae(document.documentElement);
export {
  src_default as default
};
