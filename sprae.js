// node_modules/@preact/signals-core/dist/signals-core.module.js
function i2() {
  throw new Error("Cycle detected");
}
function t() {
  if (!(n > 1)) {
    var i3, t2 = false;
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
              i3 = h3;
              t2 = true;
            }
          }
        h2 = o2;
      }
    }
    s = 0;
    n--;
    if (t2)
      throw i3;
  } else
    n--;
}
function h(i3) {
  if (n > 0)
    return i3();
  n++;
  try {
    return i3();
  } finally {
    t();
  }
}
var o = void 0;
var r = void 0;
var n = 0;
var s = 0;
var f = 0;
function v(i3) {
  if (void 0 !== o) {
    var t2 = i3.n;
    if (void 0 === t2 || t2.t !== o) {
      o.s = t2 = { i: 0, S: i3, p: void 0, n: o.s, t: o, e: void 0, x: void 0, r: t2 };
      i3.n = t2;
      if (32 & o.f)
        i3.S(t2);
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
function e(i3) {
  this.v = i3;
  this.i = 0;
  this.n = void 0;
  this.t = void 0;
}
e.prototype.h = function() {
  return true;
};
e.prototype.S = function(i3) {
  if (this.t !== i3 && void 0 === i3.e) {
    i3.x = this.t;
    if (void 0 !== this.t)
      this.t.e = i3;
    this.t = i3;
  }
};
e.prototype.U = function(i3) {
  var t2 = i3.e, h2 = i3.x;
  if (void 0 !== t2) {
    t2.x = h2;
    i3.e = void 0;
  }
  if (void 0 !== h2) {
    h2.e = t2;
    i3.x = void 0;
  }
  if (i3 === this.t)
    this.t = h2;
};
e.prototype.subscribe = function(i3) {
  var t2 = this;
  return b(function() {
    var h2 = t2.value, o2 = 32 & this.f;
    this.f &= -33;
    try {
      i3(h2);
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
  var i3 = v(this);
  if (void 0 !== i3)
    i3.i = this.i;
  return this.v;
}, set: function(h2) {
  if (h2 !== this.v) {
    if (s > 100)
      i2();
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
function u(i3) {
  return new e(i3);
}
function d(i3) {
  for (var t2 = i3.s; void 0 !== t2; t2 = t2.n)
    if (t2.S.i !== t2.i || !t2.S.h() || t2.S.i !== t2.i)
      return true;
  return false;
}
function c(i3) {
  for (var t2 = i3.s; void 0 !== t2; t2 = t2.n) {
    var h2 = t2.S.n;
    if (void 0 !== h2)
      t2.r = h2;
    t2.S.n = t2;
    t2.i = -1;
  }
}
function a(i3) {
  var t2 = i3.s, h2 = void 0;
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
  i3.s = h2;
}
function l(i3) {
  e.call(this, void 0);
  this.x = i3;
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
  var i3 = o;
  try {
    c(this);
    o = this;
    var t2 = this.x();
    if (16 & this.f || this.v !== t2 || 0 === this.i) {
      this.v = t2;
      this.f &= -17;
      this.i++;
    }
  } catch (i4) {
    this.v = i4;
    this.f |= 16;
    this.i++;
  }
  o = i3;
  a(this);
  this.f &= -2;
  return true;
};
l.prototype.S = function(i3) {
  if (void 0 === this.t) {
    this.f |= 36;
    for (var t2 = this.s; void 0 !== t2; t2 = t2.n)
      t2.S.S(t2);
  }
  e.prototype.S.call(this, i3);
};
l.prototype.U = function(i3) {
  e.prototype.U.call(this, i3);
  if (void 0 === this.t) {
    this.f &= -33;
    for (var t2 = this.s; void 0 !== t2; t2 = t2.n)
      t2.S.U(t2);
  }
};
l.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 6;
    for (var i3 = this.t; void 0 !== i3; i3 = i3.x)
      i3.t.N();
  }
};
l.prototype.peek = function() {
  if (!this.h())
    i2();
  if (16 & this.f)
    throw this.v;
  return this.v;
};
Object.defineProperty(l.prototype, "value", { get: function() {
  if (1 & this.f)
    i2();
  var t2 = v(this);
  this.h();
  if (void 0 !== t2)
    t2.i = this.i;
  if (16 & this.f)
    throw this.v;
  return this.v;
} });
function w(i3) {
  return new l(i3);
}
function y(i3) {
  var h2 = i3.u;
  i3.u = void 0;
  if ("function" == typeof h2) {
    n++;
    var r2 = o;
    o = void 0;
    try {
      h2();
    } catch (t2) {
      i3.f &= -2;
      i3.f |= 8;
      _(i3);
      throw t2;
    } finally {
      o = r2;
      t();
    }
  }
}
function _(i3) {
  for (var t2 = i3.s; void 0 !== t2; t2 = t2.n)
    t2.S.U(t2);
  i3.x = void 0;
  i3.s = void 0;
  y(i3);
}
function g(i3) {
  if (o !== this)
    throw new Error("Out-of-order effect");
  a(this);
  o = i3;
  this.f &= -2;
  if (8 & this.f)
    _(this);
  t();
}
function p(i3) {
  this.x = i3;
  this.u = void 0;
  this.s = void 0;
  this.o = void 0;
  this.f = 32;
}
p.prototype.c = function() {
  var i3 = this.S();
  try {
    if (!(8 & this.f) && void 0 !== this.x)
      this.u = this.x();
  } finally {
    i3();
  }
};
p.prototype.S = function() {
  if (1 & this.f)
    i2();
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
function b(i3) {
  var t2 = new p(i3);
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
var isStruct = (v2) => v2[_struct];
var _struct = Symbol("signal-struct");
function SignalStruct(values) {
  if (isStruct(values))
    return values;
  let state, signals;
  if (isObject(values)) {
    state = {}, signals = {};
    for (let key in values)
      signals[key] = defineSignal(state, key, values[key]);
  } else
    throw Error("Only array or object states are supported");
  Object.defineProperty(state, _struct, { configurable: false, enumerable: false, value: true });
  Object.seal(state);
  return state;
}
function defineSignal(state, key, value) {
  let isObservable, s2 = isSignal(value) ? value : isObject(value) ? u(SignalStruct(value)) : u((isObservable = observable(value)) ? void 0 : value);
  if (isObservable)
    sube_default(value, (v2) => s2.value = v2);
  Object.defineProperty(state, key, {
    get() {
      return s2.value;
    },
    set: isSignal(value) ? (v2) => s2.value = v2 : isObject(value) ? (v2) => v2 ? Object.assign(s2.value, v2) : s2.value = v2 : (v2) => s2.value = v2,
    enumerable: true,
    configurable: false
  });
  return s2;
}
function isObject(v2) {
  return v2 && v2.constructor === Object;
}

// src/core.js
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  if (memo.has(container))
    return memo.get(container);
  values ||= {};
  const state = SignalStruct(values);
  const init = (el2) => {
    let dir, stop;
    if (el2.attributes) {
      for (let i3 = 0; i3 < el2.attributes.length; ) {
        let attr = el2.attributes[i3];
        if (attr.name[0] === ":") {
          dir = directives[attr.name] || directives.default;
          el2.removeAttribute(attr.name);
          if (stop = dir(el2, attr.value, state, attr.name.slice(1)) === false)
            break;
        } else
          i3++;
      }
    }
    if (!stop)
      for (let child of el2.children)
        init(child);
  };
  init(container);
  memo.set(container, state);
  return state;
}
var directives = {};

// node_modules/element-props/element-props.js
var prop = (el2, k, v2) => {
  if (k.startsWith("on"))
    k = k.toLowerCase();
  if (el2[k] !== v2) {
    el2[k] = v2;
  }
  if (v2 === false || v2 == null)
    el2.removeAttribute(k);
  else if (typeof v2 !== "function")
    el2.setAttribute(
      dashcase(k),
      v2 === true ? "" : typeof v2 === "number" || typeof v2 === "string" ? v2 : k === "class" ? (Array.isArray(v2) ? v2 : Object.entries(v2).map(([k2, v3]) => v3 ? k2 : "")).filter(Boolean).join(" ") : k === "style" ? Object.entries(v2).map(([k2, v3]) => `${k2}: ${v3}`).join(";") : ""
    );
};
var input = (el2) => [
  el2.type === "checkbox" ? () => el2.checked : () => el2.value,
  el2.type === "text" || el2.type === "" ? (value) => el2.value = value == null ? "" : value : el2.type === "checkbox" ? (value) => (el2.value = value ? "on" : "", prop(el2, "checked", value)) : el2.type === "select-one" ? (value) => ([...el2.options].map((el3) => el3.removeAttribute("selected")), el2.value = value, el2.selectedOptions[0]?.setAttribute("selected", "")) : (value) => el2.value = value
];
var el = document.createElement("div");
var dashcase = (str) => {
  el.dataset[str] = "";
  let dashStr = el.attributes[0].name.slice(5);
  delete el.dataset[str];
  return dashStr;
};

// node_modules/swapdom/swap-inflate.js
var swap = (parent, a2, b2, end = null) => {
  let i3 = 0, cur, next, bi, n2 = b2.length, m = a2.length, { remove, same, insert, replace } = swap;
  while (i3 < n2 && i3 < m && same(a2[i3], b2[i3]))
    i3++;
  while (i3 < n2 && i3 < m && same(b2[n2 - 1], a2[m - 1]))
    end = b2[--m, --n2];
  if (i3 == m)
    while (i3 < n2)
      insert(end, b2[i3++], parent);
  else {
    cur = a2[i3];
    while (i3 < n2) {
      bi = b2[i3++], next = cur ? cur.nextSibling : end;
      if (same(cur, bi))
        cur = next;
      else if (i3 < n2 && same(b2[i3], next))
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
directives[":with"] = (el2, expr, rootState) => {
  let evaluate = parseExpr(expr, "with", rootState);
  const params = w(() => Object.assign({}, rootState, evaluate(rootState)));
  let state = sprae(el2, params.value);
  b((values = params.value) => h(() => Object.assign(state, values)));
};
directives[":if"] = (el2, expr, state) => {
  let holder = document.createTextNode(""), clauses = [parseExpr(expr, ":if", state)], els = [el2], cur = el2;
  while (cur = el2.nextElementSibling) {
    if (cur.hasAttribute(":else")) {
      cur.removeAttribute(":else");
      if (expr = cur.getAttribute(":if")) {
        cur.removeAttribute(":if"), cur.remove();
        els.push(cur);
        clauses.push(parseExpr(expr, ":else :if", state));
      } else {
        cur.remove();
        els.push(cur);
        clauses.push(() => 1);
      }
    } else
      break;
  }
  el2.replaceWith(cur = holder);
  let idx = w(() => clauses.findIndex((f2) => f2(state)));
  b((i3 = idx.value) => els[i3] != cur && ((cur[_eachHolder] || cur).replaceWith(cur = els[i3] || holder), sprae(cur, state)));
  return false;
};
var _eachHolder = Symbol(":each");
directives[":each"] = (tpl, expr, state) => {
  let each = parseForExpression(expr);
  if (!each)
    return exprError(new Error(), expr);
  const getItems = parseExpr(each.items, ":each", state);
  const holder = tpl[_eachHolder] = document.createTextNode("");
  tpl.replaceWith(holder);
  const items = w(() => {
    let list = getItems(state);
    if (typeof list === "number")
      return Array.from({ length: list }, (_2, i3) => i3 + 1);
    return list;
  });
  const scopes = /* @__PURE__ */ new WeakMap();
  const itemEls = /* @__PURE__ */ new WeakMap();
  let curEls = [];
  b((list = items.value) => {
    if (!list)
      list = [];
    let newEls = [], elScopes = [];
    for (let item of list) {
      let key = primitive_pool_default(item);
      let el2 = itemEls.get(key);
      if (!el2) {
        el2 = tpl.cloneNode(true);
        itemEls.set(key, el2);
      }
      newEls.push(el2);
      if (!scopes.has(key)) {
        let scope = Object.create(state);
        scope[each.item] = item;
        if (each.index)
          scope[each.index] = i;
        scopes.set(key, scope);
      }
      elScopes.push(scopes.get(key));
    }
    swap_inflate_default(holder.parentNode, curEls, newEls, holder);
    curEls = newEls;
    for (let i3 = 0; i3 < newEls.length; i3++) {
      sprae(newEls[i3], elScopes[i3]);
    }
  });
  return false;
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
directives["default"] = (el2, expr, state, name) => {
  let evaluate = parseExpr(expr, ":" + name, state);
  const update = (value) => prop(el2, name, value);
  b(() => update(evaluate(state)));
};
directives[":aria"] = (el2, expr, state) => {
  let evaluate = parseExpr(expr, ":aria", state);
  const update = (value) => {
    for (let key in value)
      prop(el2, "aria" + key[0].toUpperCase() + key.slice(1), value[key] == null ? null : value[key] + "");
  };
  b(() => update(evaluate(state)));
};
directives[":data"] = (el2, expr, state) => {
  let evaluate = parseExpr(expr, ":data", state);
  const value = w(() => evaluate(state));
  b((v2 = value.value) => {
    for (let key in v2)
      el2.dataset[key] = v2[key];
  });
};
directives[":on"] = (el2, expr, state) => {
  let evaluate = parseExpr(expr, ":on", state);
  let listeners = w(() => evaluate(state));
  let prevListeners;
  b((values = listeners.value) => {
    for (let evt in prevListeners)
      el2.removeEventListener(evt, prevListeners[evt]);
    prevListeners = values;
    for (let evt in prevListeners)
      el2.addEventListener(evt, prevListeners[evt]);
  });
};
directives[":"] = (el2, expr, state) => {
  let evaluate = parseExpr(expr, ":", state);
  const update = (value) => {
    if (!value)
      return;
    for (let key in value)
      prop(el2, key, value[key]);
  };
  b(() => update(evaluate(state)));
};
directives[":text"] = (el2, expr, state) => {
  let evaluate = parseExpr(expr, ":text", state);
  const update = (value) => {
    el2.textContent = value == null ? "" : value;
  };
  b(() => update(evaluate(state)));
};
directives[":value"] = (el2, expr, state) => {
  let evaluate = parseExpr(expr, ":in", state);
  let [get, set] = input(el2);
  const update = (value) => {
    prop(el2, "value", value);
    set(value);
  };
  b(() => update(evaluate(state)));
};
var evaluatorMemo = {};
function parseExpr(expression, dir, scope) {
  if (evaluatorMemo[expression])
    return evaluatorMemo[expression];
  let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(() => { ${expression} })()` : expression;
  let evaluate;
  try {
    evaluate = new Function(["scope"], `let result; with (scope) { result = ${rightSideSafeExpression} }; return result;`);
  } catch (e2) {
    return exprError(e2, expression, dir, scope);
  }
  return evaluatorMemo[expression] = (state) => {
    let result;
    try {
      result = evaluate(state);
    } catch (e2) {
      return exprError(e2, expression, dir, scope);
    }
    return result;
  };
}
function exprError(error, expression, dir, scope) {
  Object.assign(error, { expression });
  console.warn(`\u2234sprae: ${error.message}

${dir}=${expression ? `"${expression}"

` : ""}`, scope);
  setTimeout(() => {
    throw error;
  }, 0);
}

// src/index.js
var src_default = sprae;
export {
  src_default as default,
  directives
};
