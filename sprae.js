// node_modules/@preact/signals-core/dist/signals-core.module.js
function i() {
  throw new Error("Cycle detected");
}
function t() {
  if (!(n > 1)) {
    var i2, t2 = false;
    while (void 0 !== r) {
      var h2 = r;
      r = void 0;
      s++;
      while (void 0 !== h2) {
        var o2 = h2.o;
        h2.o = void 0;
        h2.f &= -3;
        if (!(8 & h2.f) && d(h2))
          try {
            h2.c();
          } catch (h3) {
            if (!t2) {
              i2 = h3;
              t2 = true;
            }
          }
        h2 = o2;
      }
    }
    s = 0;
    n--;
    if (t2)
      throw i2;
  } else
    n--;
}
function h(i2) {
  if (n > 0)
    return i2();
  n++;
  try {
    return i2();
  } finally {
    t();
  }
}
var o = void 0;
var r = void 0;
var n = 0;
var s = 0;
var f = 0;
function v(i2) {
  if (void 0 !== o) {
    var t2 = i2.n;
    if (void 0 === t2 || t2.t !== o) {
      o.s = t2 = { i: 0, S: i2, p: void 0, n: o.s, t: o, e: void 0, x: void 0, r: t2 };
      i2.n = t2;
      if (32 & o.f)
        i2.S(t2);
      return t2;
    } else if (-1 === t2.i) {
      t2.i = 0;
      if (void 0 !== t2.p) {
        t2.p.n = t2.n;
        if (void 0 !== t2.n)
          t2.n.p = t2.p;
        t2.p = void 0;
        t2.n = o.s;
        o.s.p = t2;
        o.s = t2;
      }
      return t2;
    }
  }
}
function e(i2) {
  this.v = i2;
  this.i = 0;
  this.n = void 0;
  this.t = void 0;
}
e.prototype.h = function() {
  return true;
};
e.prototype.S = function(i2) {
  if (this.t !== i2 && void 0 === i2.e) {
    i2.x = this.t;
    if (void 0 !== this.t)
      this.t.e = i2;
    this.t = i2;
  }
};
e.prototype.U = function(i2) {
  var t2 = i2.e, h2 = i2.x;
  if (void 0 !== t2) {
    t2.x = h2;
    i2.e = void 0;
  }
  if (void 0 !== h2) {
    h2.e = t2;
    i2.x = void 0;
  }
  if (i2 === this.t)
    this.t = h2;
};
e.prototype.subscribe = function(i2) {
  var t2 = this;
  return b(function() {
    var h2 = t2.value, o2 = 32 & this.f;
    this.f &= -33;
    try {
      i2(h2);
    } finally {
      this.f |= o2;
    }
  });
};
e.prototype.valueOf = function() {
  return this.value;
};
e.prototype.toString = function() {
  return this.value + "";
};
e.prototype.peek = function() {
  return this.v;
};
Object.defineProperty(e.prototype, "value", { get: function() {
  var i2 = v(this);
  if (void 0 !== i2)
    i2.i = this.i;
  return this.v;
}, set: function(h2) {
  if (h2 !== this.v) {
    if (s > 100)
      i();
    this.v = h2;
    this.i++;
    f++;
    n++;
    try {
      for (var o2 = this.t; void 0 !== o2; o2 = o2.x)
        o2.t.N();
    } finally {
      t();
    }
  }
} });
function u(i2) {
  return new e(i2);
}
function d(i2) {
  for (var t2 = i2.s; void 0 !== t2; t2 = t2.n)
    if (t2.S.i !== t2.i || !t2.S.h() || t2.S.i !== t2.i)
      return true;
  return false;
}
function c(i2) {
  for (var t2 = i2.s; void 0 !== t2; t2 = t2.n) {
    var h2 = t2.S.n;
    if (void 0 !== h2)
      t2.r = h2;
    t2.S.n = t2;
    t2.i = -1;
  }
}
function a(i2) {
  var t2 = i2.s, h2 = void 0;
  while (void 0 !== t2) {
    var o2 = t2.n;
    if (-1 === t2.i) {
      t2.S.U(t2);
      t2.n = void 0;
    } else {
      if (void 0 !== h2)
        h2.p = t2;
      t2.p = void 0;
      t2.n = h2;
      h2 = t2;
    }
    t2.S.n = t2.r;
    if (void 0 !== t2.r)
      t2.r = void 0;
    t2 = o2;
  }
  i2.s = h2;
}
function l(i2) {
  e.call(this, void 0);
  this.x = i2;
  this.s = void 0;
  this.g = f - 1;
  this.f = 4;
}
(l.prototype = new e()).h = function() {
  this.f &= -3;
  if (1 & this.f)
    return false;
  if (32 == (36 & this.f))
    return true;
  this.f &= -5;
  if (this.g === f)
    return true;
  this.g = f;
  this.f |= 1;
  if (this.i > 0 && !d(this)) {
    this.f &= -2;
    return true;
  }
  var i2 = o;
  try {
    c(this);
    o = this;
    var t2 = this.x();
    if (16 & this.f || this.v !== t2 || 0 === this.i) {
      this.v = t2;
      this.f &= -17;
      this.i++;
    }
  } catch (i3) {
    this.v = i3;
    this.f |= 16;
    this.i++;
  }
  o = i2;
  a(this);
  this.f &= -2;
  return true;
};
l.prototype.S = function(i2) {
  if (void 0 === this.t) {
    this.f |= 36;
    for (var t2 = this.s; void 0 !== t2; t2 = t2.n)
      t2.S.S(t2);
  }
  e.prototype.S.call(this, i2);
};
l.prototype.U = function(i2) {
  e.prototype.U.call(this, i2);
  if (void 0 === this.t) {
    this.f &= -33;
    for (var t2 = this.s; void 0 !== t2; t2 = t2.n)
      t2.S.U(t2);
  }
};
l.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 6;
    for (var i2 = this.t; void 0 !== i2; i2 = i2.x)
      i2.t.N();
  }
};
l.prototype.peek = function() {
  if (!this.h())
    i();
  if (16 & this.f)
    throw this.v;
  return this.v;
};
Object.defineProperty(l.prototype, "value", { get: function() {
  if (1 & this.f)
    i();
  var t2 = v(this);
  this.h();
  if (void 0 !== t2)
    t2.i = this.i;
  if (16 & this.f)
    throw this.v;
  return this.v;
} });
function w(i2) {
  return new l(i2);
}
function y(i2) {
  var h2 = i2.u;
  i2.u = void 0;
  if ("function" == typeof h2) {
    n++;
    var r2 = o;
    o = void 0;
    try {
      h2();
    } catch (t2) {
      i2.f &= -2;
      i2.f |= 8;
      _(i2);
      throw t2;
    } finally {
      o = r2;
      t();
    }
  }
}
function _(i2) {
  for (var t2 = i2.s; void 0 !== t2; t2 = t2.n)
    t2.S.U(t2);
  i2.x = void 0;
  i2.s = void 0;
  y(i2);
}
function g(i2) {
  if (o !== this)
    throw new Error("Out-of-order effect");
  a(this);
  o = i2;
  this.f &= -2;
  if (8 & this.f)
    _(this);
  t();
}
function p(i2) {
  this.x = i2;
  this.u = void 0;
  this.s = void 0;
  this.o = void 0;
  this.f = 32;
}
p.prototype.c = function() {
  var i2 = this.S();
  try {
    if (!(8 & this.f) && void 0 !== this.x)
      this.u = this.x();
  } finally {
    i2();
  }
};
p.prototype.S = function() {
  if (1 & this.f)
    i();
  this.f |= 1;
  this.f &= -9;
  y(this);
  c(this);
  n++;
  var t2 = o;
  o = this;
  return g.bind(this, t2);
};
p.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 2;
    this.o = r;
    r = this;
  }
};
p.prototype.d = function() {
  this.f |= 8;
  if (!(1 & this.f))
    _(this);
};
function b(i2) {
  var t2 = new p(i2);
  t2.c();
  return t2.d.bind(t2);
}

// node_modules/sube/sube.js
Symbol.observable ||= Symbol("observable");
var observable = (arg) => arg && !!(arg[Symbol.observable] || arg[Symbol.asyncIterator] || arg.call && arg.set || arg.subscribe || arg.then);
var registry = new FinalizationRegistry((unsub) => unsub.call?.());
var unsubr = (sub) => sub && (() => sub.unsubscribe?.());
var sube_default = (target, next, error, complete, stop, unsub) => target && (unsub = unsubr((target[Symbol.observable]?.() || target).subscribe?.(next, error, complete)) || target.set && target.call?.(stop, next) || (target.then?.((v2) => (!stop && next(v2), complete?.()), error) || (async (v2) => {
  try {
    for await (v2 of target) {
      if (stop)
        return;
      next(v2);
    }
    complete?.();
  } catch (err) {
    error?.(err);
  }
})()) && ((_2) => stop = 1), registry.register(target, unsub), unsub);

// node_modules/signal-struct/signal-struct.js
var isSignal = (v2) => v2 && v2.peek;
var isStruct = (v2) => v2 && v2[_struct];
var _struct = Symbol("signal-struct");
signalStruct.isStruct = isStruct;
function signalStruct(values, proto) {
  if (isStruct(values) && !proto)
    return values;
  if (isObject(values)) {
    const state = Object.create(proto || Object.getPrototypeOf(values)), signals = {}, descs = Object.getOwnPropertyDescriptors(values);
    for (let key in descs) {
      let desc = descs[key];
      if (desc.get) {
        let s2 = signals[key] = w(desc.get.bind(state));
        Object.defineProperty(state, key, {
          get() {
            return s2.value;
          },
          set: desc.set?.bind(state),
          configurable: false,
          enumerable: true
        });
      } else {
        let value = desc.value;
        let isObservable = observable(value), s2 = signals[key] = isSignal(value) ? value : u(
          isObservable ? void 0 : isObject(value) ? Object.seal(signalStruct(value)) : Array.isArray(value) ? signalStruct(value) : value
        );
        if (isObservable)
          sube_default(value, (v2) => s2.value = v2);
        Object.defineProperty(state, key, {
          get() {
            return s2.value;
          },
          set(v2) {
            if (isObject(v2)) {
              if (isObject(s2.value))
                try {
                  Object.assign(s2.value, v2);
                  return;
                } catch (e2) {
                }
              s2.value = Object.seal(signalStruct(v2));
            } else if (Array.isArray(v2))
              s2.value = signalStruct(v2);
            else
              s2.value = v2;
          },
          enumerable: true,
          configurable: false
        });
      }
    }
    Object.defineProperty(state, _struct, { configurable: false, enumerable: false, value: true });
    return state;
  }
  if (Array.isArray(values) && !isStruct(values[0])) {
    for (let i2 = 0; i2 < values.length; i2++)
      values[i2] = signalStruct(values[i2]);
  }
  return values;
}
function isObject(v2) {
  return v2 && v2.constructor === Object;
}

// src/domdiff.js
function domdiff_default(parent, a2, b2, before) {
  const aIdx = /* @__PURE__ */ new Map();
  const bIdx = /* @__PURE__ */ new Map();
  let i2;
  let j;
  for (i2 = 0; i2 < a2.length; i2++) {
    aIdx.set(a2[i2], i2);
  }
  for (i2 = 0; i2 < b2.length; i2++) {
    bIdx.set(b2[i2], i2);
  }
  for (i2 = j = 0; i2 !== a2.length || j !== b2.length; ) {
    var aElm = a2[i2], bElm = b2[j];
    if (aElm === null) {
      i2++;
    } else if (b2.length <= j) {
      parent.removeChild(a2[i2]);
      i2++;
    } else if (a2.length <= i2) {
      parent.insertBefore(bElm, a2[i2] || before);
      j++;
    } else if (aElm === bElm) {
      i2++;
      j++;
    } else {
      var curElmInNew = bIdx.get(aElm);
      var wantedElmInOld = aIdx.get(bElm);
      if (curElmInNew === void 0) {
        parent.removeChild(a2[i2]);
        i2++;
      } else if (wantedElmInOld === void 0) {
        parent.insertBefore(
          bElm,
          a2[i2] || before
        );
        j++;
      } else {
        parent.insertBefore(
          a2[wantedElmInOld],
          a2[i2] || before
        );
        a2[wantedElmInOld] = null;
        if (wantedElmInOld > i2 + 1)
          i2++;
        j++;
      }
    }
  }
  return b2;
}

// node_modules/primitive-pool/index.js
var cache = {};
var nullObj = {};
var undefinedObj = {};
var primitive_pool_default = (key) => {
  if (key === null)
    return nullObj;
  if (key === void 0)
    return undefinedObj;
  if (typeof key === "number" || key instanceof Number)
    return cache[key] || (cache[key] = new Number(key));
  if (typeof key === "string" || key instanceof String)
    return cache[key] || (cache[key] = new String(key));
  if (typeof key === "boolean" || key instanceof Boolean)
    return cache[key] || (cache[key] = new Boolean(key));
  return key;
};

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
  return (state) => {
    let i2 = clauses.findIndex((f2) => f2(state));
    if (els[i2] != cur) {
      ;
      (cur[_each] || cur).replaceWith(cur = els[i2] || holder);
      sprae(cur, state);
    }
  };
};
primary["with"] = (el, expr, rootState) => {
  let evaluate = parseExpr(el, expr, "with");
  sprae(el, signalStruct(evaluate(rootState), rootState));
};
var _each = Symbol(":each");
primary["each"] = (tpl, expr) => {
  let each = parseForExpression(expr);
  if (!each)
    return exprError(new Error(), tpl, expr);
  const holder = tpl[_each] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = parseExpr(tpl, each[2], ":each");
  const keyExpr = tpl.getAttribute(":key");
  const itemKey = keyExpr ? parseExpr(null, keyExpr) : null;
  tpl.removeAttribute(":key");
  const scopes = /* @__PURE__ */ new WeakMap();
  const itemEls = /* @__PURE__ */ new WeakMap();
  let curEls = [];
  return (state) => {
    let list = evaluate(state);
    if (!list)
      list = [];
    else if (typeof list === "number")
      list = Array.from({ length: list }, (_2, i2) => [i2, i2 + 1]);
    else if (Array.isArray(list))
      list = list.map((item, i2) => [i2 + 1, item]);
    else if (typeof list === "object")
      list = Object.entries(list);
    else
      exprError(Error("Bad list value"), tpl, expr, ":each", list);
    let newEls = [], elScopes = [];
    for (let [idx, item] of list) {
      let el, scope, key = itemKey?.({ [each[0]]: item, [each[1]]: idx });
      if (isPrimitive(key))
        key = primitive_pool_default(key);
      if (key == null)
        el = tpl.cloneNode(true);
      else
        (el = itemEls.get(key)) || itemEls.set(key, el = tpl.cloneNode(true));
      newEls.push(el);
      if (key == null || !(scope = scopes.get(key))) {
        scope = signalStruct({ [each[0]]: item, [each[1]]: idx }, state);
        if (key != null)
          scopes.set(key, scope);
      } else
        scope[each[0]] = item;
      elScopes.push(scope);
    }
    domdiff_default(holder.parentNode, curEls, newEls, holder);
    curEls = newEls;
    for (let i2 = 0; i2 < newEls.length; i2++) {
      sprae(newEls[i2], elScopes[i2]);
    }
  };
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
secondary["ref"] = (el, expr, state) => {
  state[expr] = el;
};
secondary["id"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":id");
  const update = (v2) => el.id = v2 || v2 === 0 ? v2 : "";
  return (state) => update(evaluate(state));
};
secondary["class"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":class");
  let initClassName = el.className;
  return (state) => {
    let v2 = evaluate(state);
    el.className = initClassName + typeof v2 === "string" ? v2 : (Array.isArray(v2) ? v2 : Object.entries(v2).map(([k, v3]) => v3 ? k : "")).filter(Boolean).join(" ");
  };
};
secondary["style"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":style");
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";"))
    initStyle += "; ";
  return (state) => {
    let v2 = evaluate(state);
    if (typeof v2 === "string")
      el.setAttribute("style", initStyle + v2);
    else
      for (let k in v2)
        el.style[k] = v2[k];
  };
};
secondary["text"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":text");
  return (state) => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  };
};
secondary["data"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":data");
  return (state) => {
    let value = evaluate(state);
    for (let key in value)
      el.dataset[key] = value[key];
  };
};
secondary["aria"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":aria");
  const update = (value) => {
    for (let key in value)
      attr(el, "aria-" + dashcase(key), value[key] == null ? null : value[key] + "");
  };
  return (state) => update(evaluate(state));
};
secondary[""] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":");
  if (evaluate)
    return (state) => {
      let value = evaluate(state);
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
  return (state) => update(evaluate(state));
};
secondary["on"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":on");
  return (state) => {
    let listeners = evaluate(state);
    for (let evt in listeners)
      addListener(el, evt, listeners[evt]);
    return () => {
      for (let evt in listeners)
        listeners[evt][_off]?.();
    };
  };
};
var directives_default = (el, expr, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parseExpr(el, expr, ":" + name);
  if (!evaluate)
    return;
  if (evt)
    return (state2) => {
      let value = evaluate(state2) || (() => {
      });
      addListener(el, evt, value);
      return () => value[_off]();
    };
  return (state2) => attr(el, name, evaluate(state2));
};
var _stop = Symbol("stop");
var _off = Symbol("off");
var addListener = (target, evt, origFn) => {
  let ctxs = evt.split("..").map((e2) => {
    let ctx = { evt: "", target, opts: {}, test: () => true, hook: null, mods: {}, origFn };
    ctx.evt = (e2.startsWith("on") ? e2.slice(2) : e2).replace(
      /\.(\w+)?-?([\w]+)?/g,
      (match, mod, param) => (ctx.mods[mod] = param, mods[mod]?.(ctx, param), "")
    );
    return ctx;
  });
  if (!origFn)
    origFn = () => {
    };
  if (ctxs.length == 1)
    addWrapped(origFn, ctxs[0]);
  else {
    const nextEvt = (fn, cur = 0) => {
      let curListener = (e2) => {
        curListener[_off]();
        console.log(e2.type, e2.key);
        if (typeof (fn = fn.call(target, e2)) !== "function")
          fn = () => {
          };
        if (++cur < ctxs.length)
          nextEvt(fn, cur);
        else
          nextEvt(origFn);
      };
      console.log("add", ctxs[cur].evt, ctxs[cur].mods);
      addWrapped(curListener, ctxs[cur]);
    };
    nextEvt(origFn);
  }
};
var addWrapped = (fn, { evt, target, opts, test, hook }, wrappedFn = (e2) => test(e2) && (hook?.(e2), fn.call(target, e2))) => (target.addEventListener(evt, wrappedFn, opts), fn[_off] = () => (fn[_off] = null, target.removeEventListener(evt, wrappedFn, opts)));
var mods = {
  prevent(ctx) {
    ctx.hook = (e2) => e2.preventDefault();
  },
  stop(ctx) {
    ctx.hook = (e2) => e2.stopPropagation();
  },
  throttle(ctx, limit) {
    let { fn } = ctx;
    limit = Number(limit) || 108;
    let pause, planned, block = (e2) => {
      pause = true;
      setTimeout(() => {
        pause = false;
        if (planned)
          return planned = false, block(), fn(e2);
      }, limit);
    };
    ctx.fn = (e2) => {
      if (pause)
        return planned = true;
      block(e2);
      return fn(e2);
    };
  },
  debounce(ctx, wait) {
    let { fn } = ctx;
    wait = Number(wait) || 108;
    let timeout;
    ctx.fn = (e2) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        timeout = null;
        fn(e2);
      }, wait);
    };
  },
  once(ctx) {
    ctx.opts.once = true;
  },
  passive(ctx) {
    ctx.opts.passive = true;
  },
  capture(ctx) {
    ctx.opts.capture = true;
  },
  window(ctx) {
    ctx.target = window;
  },
  document(ctx) {
    ctx.target = document;
  },
  outside(ctx) {
    ctx.test = (e2) => {
      let { target } = ctx;
      if (target.contains(e2.target))
        return;
      if (e2.target.isConnected === false)
        return;
      if (target.offsetWidth < 1 && target.offsetHeight < 1)
        return;
      return true;
    };
  },
  self(ctx) {
    ctx.test = (e2) => e2.target === ctx.target;
  },
  ctrl(ctx) {
    ctx.test = (e2) => e2.key === "Control" || e2.key === "Ctrl";
  },
  shift(ctx) {
    ctx.test = (e2) => e2.key === "Shift";
  },
  alt(ctx) {
    ctx.test = (e2) => e2.key === "Alt";
  },
  meta(ctx) {
    ctx.test = (e2) => e2.key === "Meta";
  },
  arrow(ctx) {
    ctx.test = (e2) => e2.key.startsWith("Arrow");
  },
  enter(ctx) {
    ctx.test = (e2) => e2.key === "Enter";
  },
  escape(ctx) {
    ctx.test = (e2) => e2.key.startsWith("Esc");
  },
  tab(ctx) {
    ctx.test = (e2) => e2.key === "Tab";
  },
  space(ctx) {
    ctx.test = (e2) => e2.key === "Space" || e2.key === " ";
  },
  backspace(ctx) {
    ctx.test = (e2) => e2.key === "Backspace";
  },
  delete(ctx) {
    ctx.test = (e2) => e2.key === "Delete";
  },
  digit(ctx) {
    ctx.test = (e2) => /^\d$/.test(e2.key);
  },
  letter(ctx) {
    ctx.test = (e2) => /^[a-zA-Z]$/.test(e2.key);
  },
  character(ctx) {
    ctx.test = (e2) => /^\S$/.test(e2.key);
  }
};
var attr = (el, name, v2) => {
  if (v2 == null || v2 === false)
    el.removeAttribute(name);
  else
    el.setAttribute(name, v2 === true ? "" : typeof v2 === "number" || typeof v2 === "string" ? v2 : "");
};
var evaluatorMemo = {};
function parseExpr(el, expression, dir) {
  let evaluate = evaluatorMemo[expression];
  if (!evaluate) {
    let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /\b(let|const)\s/.test(expression) ? `(() => { ${expression} })()` : expression;
    try {
      evaluate = evaluatorMemo[expression] = new Function(`__scope`, `with (__scope) { return ${rightSideSafeExpression} };`);
    } catch (e2) {
      return exprError(e2, el, expression, dir);
    }
  }
  return (state) => {
    let result;
    try {
      result = evaluate.call(el, state);
    } catch (e2) {
      return exprError(e2, el, expression, dir);
    }
    return result;
  };
}
function exprError(error, element, expression, dir) {
  Object.assign(error, { element, expression });
  console.warn(`\u2234 ${error.message}

${dir}=${expression ? `"${expression}"

` : ""}`, element);
  setTimeout(() => {
    throw error;
  }, 0);
}
function dashcase(str) {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => "-" + match.toLowerCase());
}
function isPrimitive(obj) {
  return typeof obj === "string" || typeof obj === "boolean" || typeof obj === "number";
}

// src/core.js
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  if (memo.has(container)) {
    let state2 = memo.get(container);
    h(() => Object.assign(state2, values));
    return state2;
  }
  const state = signalStruct(values || {});
  const updates = [];
  const init = (el, parent = el.parentNode) => {
    for (let name in primary) {
      let attrName = ":" + name;
      if (el.hasAttribute?.(attrName)) {
        let expr = el.getAttribute(attrName);
        el.removeAttribute(attrName);
        updates.push(primary[name](el, expr, state, name));
        if (memo.has(el) || el.parentNode !== parent)
          return false;
      }
    }
    if (el.attributes) {
      for (let i2 = 0; i2 < el.attributes.length; ) {
        let attr2 = el.attributes[i2];
        if (attr2.name[0] !== ":") {
          i2++;
          continue;
        }
        el.removeAttribute(attr2.name);
        let expr = attr2.value;
        let attrNames = attr2.name.slice(1).split(":");
        for (let attrName of attrNames) {
          let dir = secondary[attrName] || directives_default;
          updates.push(dir(el, expr, state, attrName));
          if (memo.has(el) || el.parentNode !== parent)
            return false;
        }
      }
    }
    for (let i2 = 0, child; child = el.children[i2]; i2++) {
      if (init(child, el) === false)
        i2--;
    }
  };
  init(container);
  for (let update of updates)
    if (update) {
      let teardown;
      b(() => {
        if (typeof teardown === "function")
          teardown();
        teardown = update(state);
      });
    }
  Object.seal(state);
  memo.set(container, state);
  return state;
}

// src/index.js
var src_default = sprae;
export {
  src_default as default
};
