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

// node_modules/signal-struct/signal-struct.js
var isSignal = (v2) => v2 && v2.peek;
var _struct = Symbol("signal-struct");
var isStruct = (v2) => v2[_struct];
function SignalStruct(values) {
  if (isStruct(values))
    return values;
  const toSignal = (val) => {
    if (!val || typeof val === "string" || typeof val === "number")
      return u(val);
    if (isSignal(val))
      return val;
    if (Array.isArray(val))
      return Object.freeze(val.map(toSignal));
    if (isObject(val)) {
      return Object.freeze(Object.fromEntries(Object.entries(val).map(([key, val2]) => [key, toSignal(val2)])));
    }
    return u(val);
  };
  const signals = toSignal(values);
  const toAccessor = (signals2, isRoot) => {
    let out;
    if (Array.isArray(signals2)) {
      out = [];
      for (let i2 = 0; i2 < signals2.length; i2++)
        defineAccessor(signals2[i2], i2, out);
    } else if (isObject(signals2)) {
      out = {};
      for (let key in signals2)
        defineAccessor(signals2[key], key, out);
    } else
      out = signals2;
    if (isRoot) {
      Object.defineProperty(out, Symbol.iterator, {
        value: function* () {
          yield signals2;
          yield (diff) => h(() => deepAssign(out, diff));
        },
        enumerable: false,
        configurable: false
      });
      out[_struct] = true;
    }
    return Object.seal(out);
  };
  const defineAccessor = (signal, key, out) => {
    if (isSignal(signal))
      Object.defineProperty(out, key, {
        get() {
          return signal.value;
        },
        set(v2) {
          signal.value = v2;
        },
        enumerable: true,
        configurable: false
      });
    else
      out[key] = toAccessor(signal);
  };
  let state = toAccessor(signals, true);
  return state;
}
function deepAssign(target, source) {
  for (let k in source) {
    let vs = source[k], vt = target[k];
    if (isObject(vs) && isObject(vt)) {
      target[k] = deepAssign(vt, vs);
    } else
      target[k] = source[k];
  }
  return target;
}
function isObject(v2) {
  return typeof v2 === "object" && v2 !== null;
}

// src/core.js
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (memo.has(container))
    return memo.get(container);
  values ||= {};
  const state = SignalStruct(values);
  for (let name in directives) {
    const sel = `[${name.replaceAll(":", "\\:")}]`, initDirective = directives[name];
    if (container.matches?.(sel))
      initDirective(container, state);
    container.querySelectorAll?.(sel).forEach((el2) => container.contains(el2) && initDirective(el2, state));
  }
  ;
  memo.set(container, state);
  return state;
}
var directives = {};
var directive = (name, initialize) => {
  const className = name.replaceAll(":", "\u2234");
  return directives[name] = (el2, state) => {
    if (el2.classList.contains(className))
      return;
    el2.classList.add(className);
    let expr = el2.getAttribute(name);
    el2.removeAttribute(name);
    initialize(el2, expr, state);
  };
};

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

// src/directives.js
directive(":with", (el2, expr, rootState) => {
  let evaluate = parseExpr(expr, "with");
  const [rootSignals] = rootState;
  sprae(el2, Object.assign({}, rootSignals, evaluate(rootSignals)));
});
directive(":if", (el2, expr, state) => {
  let holder = new Text(), clauses = [parseExpr(expr, "if")], els = [el2], cur = el2;
  while (cur = el2.nextElementSibling) {
    if (cur.hasAttribute(":else")) {
      cur.removeAttribute(":else");
      if (expr = cur.getAttribute(":if")) {
        cur.removeAttribute(":if"), cur.remove();
        els.push(cur);
        clauses.push(parseExpr(expr, "else-if"));
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
  idx.subscribe((i2) => els[i2] != cur && (cur.replaceWith(cur = els[i2] || holder), sprae(cur, state)));
});
common(`id`), common(`name`), common(`for`), common(`type`), common(`hidden`), common(`disabled`), common(`href`), common(`src`), common(`style`), common(`class`);
function common(name) {
  directive(":" + name, (el2, expr, state) => {
    let evaluate = parseExpr(expr, name);
    const update = (value) => prop(el2, name, value);
    b(() => update(evaluate(state)));
  });
}
directive(":aria", (el2, expr, state) => {
  let evaluate = parseExpr(expr, "aria");
  const update = (value2) => {
    for (let key in value2)
      prop(el2, "aria" + key[0].toUpperCase() + key.slice(1), value2[key]);
  };
  const value = w(() => evaluate(state));
  value.subscribe(update);
});
directive(":data", (el2, expr, state) => {
  let evaluate = parseExpr(expr, "aria");
  const value = w(() => evaluate(state));
  value.subscribe((value2) => {
    for (let key in value2)
      el2.dataset[key] = value2[key];
  });
});
directive(":on", (el2, expr, state) => {
  let evaluate = parseExpr(expr, "aria");
  let listeners = w(() => evaluate(state));
  let prevListeners;
  listeners.subscribe((values) => {
    for (let evt in prevListeners)
      el2.removeEventListener(evt, prevListeners[evt]);
    prevListeners = values;
    for (let evt in prevListeners)
      el2.addEventListener(evt, prevListeners[evt]);
  });
});
directive(":prop", (el2, expr, state) => {
  let evaluate = parseExpr(expr, "prop");
  const update = (value2) => {
    if (!value2)
      return;
    for (let key in value2)
      prop(el2, key, value2[key]);
  };
  const value = w(() => evaluate(state));
  value.subscribe(update);
});
directive(":text", (el2, expr, state) => {
  let evaluate = parseExpr(expr, "text");
  const update = (value2) => {
    el2.textContent = value2 == null ? "" : value2;
  };
  const value = w(() => evaluate(state));
  value.subscribe(update);
});
directive(":value", (el2, expr, state) => {
  let evaluate = parseExpr(expr, "value");
  let [get, set] = input(el2);
  let evaluateSet = parseSetter(expr);
  let onchange = (e2) => evaluateSet(state, get(el2));
  el2.addEventListener("input", onchange);
  el2.addEventListener("change", onchange);
  const value = w(() => evaluate(state));
  value.subscribe((value2) => {
    prop(el2, "value", value2);
    set(value2);
  });
});
var memo2 = {};
function parseSetter(expr) {
  if (memo2[expr])
    return memo2[expr];
  return memo2[expr] = new Function(
    ["scope", "value"],
    `with (scope) { ${expr} = value };`
  );
}
var evaluatorMemo = {};
function parseExpr(expression, dir) {
  if (evaluatorMemo[expression])
    return evaluatorMemo[expression];
  let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(() => { ${expression} })()` : expression;
  let evaluate;
  try {
    evaluate = new Function(["scope"], `let result; with (scope) { result = ${rightSideSafeExpression} }; return result;`);
  } catch (e2) {
    return exprError(e2, expression, dir);
  }
  return evaluatorMemo[expression] = (state) => {
    let result;
    try {
      result = evaluate(state);
    } catch (e2) {
      return exprError(e2, expression, dir);
    }
    return result;
  };
}
function exprError(error, expression, dir) {
  Object.assign(error, { expression });
  console.warn(`\u2234 ${error.message}

${dir}=${expression ? `"${expression}"

` : ""}`);
  setTimeout(() => {
    throw error;
  }, 0);
}

// src/index.js
var src_default = sprae;
export {
  src_default as default,
  directive,
  directives
};
