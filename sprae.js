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
  let state, signals;
  if (isObject(values)) {
    state = Object.create(proto || Object.getPrototypeOf(values)), signals = {};
    let desc = Object.getOwnPropertyDescriptors(values);
    if (isStruct(values))
      for (let key in desc)
        Object.defineProperty(state, key, desc[key]);
    else
      for (let key in desc)
        signals[key] = defineSignal(state, key, desc[key].get ? w(desc[key].get.bind(state)) : desc[key].value);
    Object.defineProperty(state, _struct, { configurable: false, enumerable: false, value: true });
    return state;
  }
  if (Array.isArray(values)) {
    return values.map((v2) => signalStruct(v2));
  }
  return values;
}
function defineSignal(state, key, value) {
  let isObservable, s2 = isSignal(value) ? value : isObject(value) || Array.isArray(value) ? u(signalStruct(value)) : u((isObservable = observable(value)) ? void 0 : value);
  if (isObservable)
    sube_default(value, (v2) => s2.value = v2);
  Object.defineProperty(state, key, {
    get() {
      return s2.value;
    },
    set: !isSignal(value) && isObject(value) ? (v2) => v2 ? Object.assign(s2.value, v2) : s2.value = signalStruct(v2) : (v2) => s2.value = signalStruct(v2),
    enumerable: true,
    configurable: false
  });
  return s2;
}
function isObject(v2) {
  return v2 && v2.constructor === Object;
}

// node_modules/swapdom/swap-inflate.js
var swap = (parent, a2, b2, end = null) => {
  let i2 = 0, cur, next, bi, n2 = b2.length, m = a2.length, { remove, same, insert, replace } = swap;
  while (i2 < n2 && i2 < m && same(a2[i2], b2[i2]))
    i2++;
  while (i2 < n2 && i2 < m && same(b2[n2 - 1], a2[m - 1]))
    end = b2[--m, --n2];
  if (i2 == m)
    while (i2 < n2)
      insert(end, b2[i2++], parent);
  else {
    cur = a2[i2];
    while (i2 < n2) {
      bi = b2[i2++], next = cur ? cur.nextSibling : end;
      if (same(cur, bi))
        cur = next;
      else if (i2 < n2 && same(b2[i2], next))
        replace(cur, bi, parent), cur = next;
      else
        insert(cur, bi, parent);
    }
    while (!same(cur, end))
      next = cur.nextSibling, remove(cur, parent), cur = next;
  }
  return b2;
};
swap.same = (a2, b2) => a2 == b2;
swap.replace = (a2, b2, parent) => parent.replaceChild(b2, a2);
swap.insert = (a2, b2, parent) => parent.insertBefore(b2, a2);
swap.remove = (a2, parent) => parent.removeChild(a2);
var swap_inflate_default = swap;

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
var directives = {};
var directives_default = (el, expr, values, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parseExpr(el, expr, ":" + name);
  let value;
  return evt ? (state) => {
    value && removeListener(el, evt, value);
    value = evaluate(state);
    value && addListener(el, evt, value);
  } : (state) => attr(el, name, evaluate(state));
};
var attr = (el, name, v2) => {
  if (v2 == null || v2 === false)
    el.removeAttribute(name);
  else
    el.setAttribute(name, v2 === true ? "" : typeof v2 === "number" || typeof v2 === "string" ? v2 : "");
};
directives[""] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":");
  return (state) => {
    let value = evaluate(state);
    for (let key in value)
      attr(el, dashcase(key), value[key]);
  };
};
var _each = Symbol(":each");
var _ref = Symbol(":ref");
directives["ref"] = (el, expr, state) => {
  if (el.hasAttribute(":each")) {
    el[_ref] = expr;
    return;
  }
  ;
  state[expr] = el;
};
directives["with"] = (el, expr, rootState) => {
  let evaluate = parseExpr(el, expr, "with");
  sprae(el, signalStruct(evaluate(rootState), rootState));
};
directives["if"] = (el, expr) => {
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
      (cur[_each] || cur).replaceWith(cur = els[i2] || holder);
      sprae(cur, state);
    }
  };
};
directives["each"] = (tpl, expr) => {
  let each = parseForExpression(expr);
  if (!each)
    return exprError(new Error(), tpl, expr);
  const holder = tpl[_each] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = parseExpr(tpl, each.items, ":each");
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
      let itemKey = primitive_pool_default(item);
      let el = itemEls.get(itemKey);
      if (!el) {
        el = tpl.cloneNode(true);
        itemEls.set(itemKey, el);
      }
      newEls.push(el);
      if (!scopes.has(itemKey)) {
        let scope = Object.create(state);
        scope[each.item] = item;
        if (each.index)
          scope[each.index] = idx;
        if (tpl[_ref])
          scope[tpl[_ref]] = el;
        scopes.set(itemKey, scope);
      }
      elScopes.push(scopes.get(itemKey));
    }
    swap_inflate_default(holder.parentNode, curEls, newEls, holder);
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
  let res = {};
  res.items = inMatch[2].trim();
  let item = inMatch[1].replace(stripParensRE, "").trim();
  let iteratorMatch = item.match(forIteratorRE);
  if (iteratorMatch) {
    res.item = item.replace(forIteratorRE, "").trim();
    res.index = iteratorMatch[1].trim();
  } else {
    res.item = item;
  }
  return res;
}
directives["id"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":id");
  const update = (v2) => el.id = v2 || v2 === 0 ? v2 : "";
  return (state) => update(evaluate(state));
};
directives["class"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":class");
  let initClassName = el.className;
  return (state) => {
    let v2 = evaluate(state);
    el.className = initClassName + typeof v2 === "string" ? v2 : (Array.isArray(v2) ? v2 : Object.entries(v2).map(([k, v3]) => v3 ? k : "")).filter(Boolean).join(" ");
  };
};
directives["style"] = (el, expr) => {
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
directives["text"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":text");
  return (state) => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  };
};
directives["value"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":value");
  let update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.type === "checkbox" ? (value) => (el.value = value ? "on" : "", attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
    for (let option in el.options)
      option.removeAttribute("selected");
    el.value = value;
    el.selectedOptions[0]?.setAttribute("selected", "");
  } : (value) => el.value = value;
  return (state) => update(evaluate(state));
};
var _stop = Symbol("stop");
directives["on"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":on");
  let listeners = {};
  return (state) => {
    for (let evt in listeners)
      removeListener(el, evt, listeners[evt]);
    listeners = evaluate(state);
    for (let evt in listeners)
      addListener(el, evt, listeners[evt]);
  };
};
var addListener = (el, evt, startFn) => {
  if (evt.indexOf("..") < 0)
    el.addEventListener(evt, startFn);
  else {
    const evts = evt.split("..").map((e2) => e2.startsWith("on") ? e2.slice(2) : e2);
    const nextEvt = (fn, cur = 0) => {
      let curListener = (e2) => {
        el.removeEventListener(evts[cur], curListener);
        if (typeof (fn = fn.call(el, e2)) !== "function")
          fn = () => {
          };
        if (++cur < evts.length)
          nextEvt(fn, cur);
        else if (!startFn[_stop])
          console.log("reset"), nextEvt(startFn);
      };
      el.addEventListener(evts[cur], curListener);
    };
    nextEvt(startFn);
  }
};
var removeListener = (el, evt, fn) => {
  if (evt.indexOf("..") >= 0)
    console.log("rewire"), fn[_stop] = true;
  el.removeEventListener(evt, fn);
};
directives["data"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":data");
  return (state) => {
    let value = evaluate(state);
    for (let key in value)
      el.dataset[key] = value[key];
  };
};
directives["aria"] = (el, expr) => {
  let evaluate = parseExpr(el, expr, ":aria");
  const update = (value) => {
    for (let key in value)
      attr(el, "aria-" + dashcase(key), value[key] == null ? null : value[key] + "");
  };
  return (state) => update(evaluate(state));
};
var evaluatorMemo = {};
function parseExpr(el, expression, dir) {
  if (evaluatorMemo[expression])
    return evaluatorMemo[expression];
  let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(() => { ${expression} })()` : expression;
  let evaluate;
  try {
    evaluate = new Function(`__scope`, `with (__scope) { return (${rightSideSafeExpression}) };`).bind(el);
  } catch (e2) {
    return exprError(e2, el, expression, dir);
  }
  return evaluatorMemo[expression] = (state) => {
    let result;
    try {
      result = evaluate(state);
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

// src/core.js
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  if (memo.has(container))
    return memo.get(container);
  const state = signalStruct(values || {});
  const updates = [];
  const init = (el, parent = el.parentNode) => {
    if (el.attributes) {
      for (let i2 = 0; i2 < el.attributes.length; ) {
        let attr2 = el.attributes[i2];
        if (attr2.name[0] !== ":") {
          i2++;
          continue;
        }
        el.removeAttribute(attr2.name);
        let expr = attr2.value;
        if (!expr)
          continue;
        let attrNames = attr2.name.slice(1).split(":");
        for (let attrName of attrNames) {
          let dir = directives[attrName] || directives_default;
          updates.push(dir(el, expr, state, attrName) || (() => {
          }));
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
    b(() => update(state));
  Object.seal(state);
  memo.set(container, state);
  return state;
}

// src/index.js
var src_default = sprae;
export {
  src_default as default
};
