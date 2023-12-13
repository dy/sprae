// node_modules/@preact/signals-core/dist/signals-core.module.js
function i() {
  throw new Error("Cycle detected");
}
var t = Symbol.for("preact-signals");
function r() {
  if (!(v > 1)) {
    var i2, t2 = false;
    while (void 0 !== f) {
      var r2 = f;
      f = void 0;
      e++;
      while (void 0 !== r2) {
        var n2 = r2.o;
        r2.o = void 0;
        r2.f &= -3;
        if (!(8 & r2.f) && l(r2))
          try {
            r2.c();
          } catch (r3) {
            if (!t2) {
              i2 = r3;
              t2 = true;
            }
          }
        r2 = n2;
      }
    }
    e = 0;
    v--;
    if (t2)
      throw i2;
  } else
    v--;
}
function n(i2) {
  if (v > 0)
    return i2();
  v++;
  try {
    return i2();
  } finally {
    r();
  }
}
var o = void 0;
var h = 0;
function s(i2) {
  if (h > 0)
    return i2();
  var t2 = o;
  o = void 0;
  h++;
  try {
    return i2();
  } finally {
    h--;
    o = t2;
  }
}
var f = void 0;
var v = 0;
var e = 0;
var u = 0;
function c(i2) {
  if (void 0 !== o) {
    var t2 = i2.n;
    if (void 0 === t2 || t2.t !== o) {
      t2 = { i: 0, S: i2, p: o.s, n: void 0, t: o, e: void 0, x: void 0, r: t2 };
      if (void 0 !== o.s)
        o.s.n = t2;
      o.s = t2;
      i2.n = t2;
      if (32 & o.f)
        i2.S(t2);
      return t2;
    } else if (-1 === t2.i) {
      t2.i = 0;
      if (void 0 !== t2.n) {
        t2.n.p = t2.p;
        if (void 0 !== t2.p)
          t2.p.n = t2.n;
        t2.p = o.s;
        t2.n = void 0;
        o.s.n = t2;
        o.s = t2;
      }
      return t2;
    }
  }
}
function d(i2) {
  this.v = i2;
  this.i = 0;
  this.n = void 0;
  this.t = void 0;
}
d.prototype.brand = t;
d.prototype.h = function() {
  return true;
};
d.prototype.S = function(i2) {
  if (this.t !== i2 && void 0 === i2.e) {
    i2.x = this.t;
    if (void 0 !== this.t)
      this.t.e = i2;
    this.t = i2;
  }
};
d.prototype.U = function(i2) {
  if (void 0 !== this.t) {
    var t2 = i2.e, r2 = i2.x;
    if (void 0 !== t2) {
      t2.x = r2;
      i2.e = void 0;
    }
    if (void 0 !== r2) {
      r2.e = t2;
      i2.x = void 0;
    }
    if (i2 === this.t)
      this.t = r2;
  }
};
d.prototype.subscribe = function(i2) {
  var t2 = this;
  return O(function() {
    var r2 = t2.value, n2 = 32 & this.f;
    this.f &= -33;
    try {
      i2(r2);
    } finally {
      this.f |= n2;
    }
  });
};
d.prototype.valueOf = function() {
  return this.value;
};
d.prototype.toString = function() {
  return this.value + "";
};
d.prototype.toJSON = function() {
  return this.value;
};
d.prototype.peek = function() {
  return this.v;
};
Object.defineProperty(d.prototype, "value", { get: function() {
  var i2 = c(this);
  if (void 0 !== i2)
    i2.i = this.i;
  return this.v;
}, set: function(t2) {
  if (o instanceof _)
    !function() {
      throw new Error("Computed cannot have side-effects");
    }();
  if (t2 !== this.v) {
    if (e > 100)
      i();
    this.v = t2;
    this.i++;
    u++;
    v++;
    try {
      for (var n2 = this.t; void 0 !== n2; n2 = n2.x)
        n2.t.N();
    } finally {
      r();
    }
  }
} });
function a(i2) {
  return new d(i2);
}
function l(i2) {
  for (var t2 = i2.s; void 0 !== t2; t2 = t2.n)
    if (t2.S.i !== t2.i || !t2.S.h() || t2.S.i !== t2.i)
      return true;
  return false;
}
function y(i2) {
  for (var t2 = i2.s; void 0 !== t2; t2 = t2.n) {
    var r2 = t2.S.n;
    if (void 0 !== r2)
      t2.r = r2;
    t2.S.n = t2;
    t2.i = -1;
    if (void 0 === t2.n) {
      i2.s = t2;
      break;
    }
  }
}
function w(i2) {
  var t2 = i2.s, r2 = void 0;
  while (void 0 !== t2) {
    var n2 = t2.p;
    if (-1 === t2.i) {
      t2.S.U(t2);
      if (void 0 !== n2)
        n2.n = t2.n;
      if (void 0 !== t2.n)
        t2.n.p = n2;
    } else
      r2 = t2;
    t2.S.n = t2.r;
    if (void 0 !== t2.r)
      t2.r = void 0;
    t2 = n2;
  }
  i2.s = r2;
}
function _(i2) {
  d.call(this, void 0);
  this.x = i2;
  this.s = void 0;
  this.g = u - 1;
  this.f = 4;
}
(_.prototype = new d()).h = function() {
  this.f &= -3;
  if (1 & this.f)
    return false;
  if (32 == (36 & this.f))
    return true;
  this.f &= -5;
  if (this.g === u)
    return true;
  this.g = u;
  this.f |= 1;
  if (this.i > 0 && !l(this)) {
    this.f &= -2;
    return true;
  }
  var i2 = o;
  try {
    y(this);
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
  w(this);
  this.f &= -2;
  return true;
};
_.prototype.S = function(i2) {
  if (void 0 === this.t) {
    this.f |= 36;
    for (var t2 = this.s; void 0 !== t2; t2 = t2.n)
      t2.S.S(t2);
  }
  d.prototype.S.call(this, i2);
};
_.prototype.U = function(i2) {
  if (void 0 !== this.t) {
    d.prototype.U.call(this, i2);
    if (void 0 === this.t) {
      this.f &= -33;
      for (var t2 = this.s; void 0 !== t2; t2 = t2.n)
        t2.S.U(t2);
    }
  }
};
_.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 6;
    for (var i2 = this.t; void 0 !== i2; i2 = i2.x)
      i2.t.N();
  }
};
_.prototype.peek = function() {
  if (!this.h())
    i();
  if (16 & this.f)
    throw this.v;
  return this.v;
};
Object.defineProperty(_.prototype, "value", { get: function() {
  if (1 & this.f)
    i();
  var t2 = c(this);
  this.h();
  if (void 0 !== t2)
    t2.i = this.i;
  if (16 & this.f)
    throw this.v;
  return this.v;
} });
function g(i2) {
  var t2 = i2.u;
  i2.u = void 0;
  if ("function" == typeof t2) {
    v++;
    var n2 = o;
    o = void 0;
    try {
      t2();
    } catch (t3) {
      i2.f &= -2;
      i2.f |= 8;
      b(i2);
      throw t3;
    } finally {
      o = n2;
      r();
    }
  }
}
function b(i2) {
  for (var t2 = i2.s; void 0 !== t2; t2 = t2.n)
    t2.S.U(t2);
  i2.x = void 0;
  i2.s = void 0;
  g(i2);
}
function x(i2) {
  if (o !== this)
    throw new Error("Out-of-order effect");
  w(this);
  o = i2;
  this.f &= -2;
  if (8 & this.f)
    b(this);
  r();
}
function E(i2) {
  this.x = i2;
  this.u = void 0;
  this.s = void 0;
  this.o = void 0;
  this.f = 32;
}
E.prototype.c = function() {
  var i2 = this.S();
  try {
    if (8 & this.f)
      return;
    if (void 0 === this.x)
      return;
    var t2 = this.x();
    if ("function" == typeof t2)
      this.u = t2;
  } finally {
    i2();
  }
};
E.prototype.S = function() {
  if (1 & this.f)
    i();
  this.f |= 1;
  this.f &= -9;
  g(this);
  y(this);
  v++;
  var t2 = o;
  o = this;
  return x.bind(this, t2);
};
E.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 2;
    this.o = f;
    f = this;
  }
};
E.prototype.d = function() {
  this.f |= 8;
  if (!(1 & this.f))
    b(this);
};
function O(i2) {
  var t2 = new E(i2);
  try {
    t2.c();
  } catch (i3) {
    t2.d();
    throw i3;
  }
  return t2.d.bind(t2);
}

// node_modules/sube/sube.js
Symbol.observable ||= Symbol("observable");
var registry = new FinalizationRegistry((unsub) => unsub.call?.());

// src/util.js
var queueMicrotask = Promise.prototype.then.bind(Promise.resolve());

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

// src/directives.js
var primary = {};
var secondary = {};
primary["if"] = (el, expr, state) => {
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
  const dispose = O(() => {
    let i2 = clauses.findIndex((evaluate) => evaluate(state.value)?.valueOf());
    if (els[i2] != cur) {
      ;
      (cur[_each] || cur).replaceWith(cur = els[i2] || holder);
    }
    sprae(cur, state.value);
  });
  return () => {
    for (const el2 of els)
      el2[_dispose]?.();
    dispose();
  };
};
var _each = Symbol(":each");
var _scope = Symbol(":scope");
primary["each"] = (tpl, expr, state) => {
  let each = parseForExpression(expr);
  if (!each)
    return exprError(new Error(), tpl, expr, ":each");
  const [itemVar, idxVar, itemsExpr] = each;
  const holder = tpl[_each] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = parseExpr(tpl, itemsExpr, ":each");
  let cache = {}, curEls = [];
  O(() => {
    let values = state.value, newItems = evaluate(values).valueOf(), keys2;
    if (!newItems)
      newItems = keys2 = [];
    else if (typeof newItems === "number")
      newItems = keys2 = Array.from({ length: newItems }).map((_2, i2) => i2);
    else if (Array.isArray(newItems))
      keys2 = newItems.map((item, i2) => i2);
    else if (typeof newItems === "object")
      keys2 = Object.keys(newItems), newItems = Object.values(newItems);
    else
      exprError(Error("Bad items value"), tpl, expr, ":each", newItems);
    const newEls = [];
    for (let item of newItems) {
      let key = item?.key || item?.id;
      let el = key != null && cache[key];
      if (!el) {
        el = tpl.cloneNode(true);
        if (key != null)
          cache[key] = el;
      }
      newEls.push(el);
    }
    swap_inflate_default(holder.parentNode, curEls, newEls, holder);
    curEls = newEls;
    for (let i2 = 0, l2 = newEls.length; i2 < l2; i2++)
      sprae(newEls[i2], Object.assign(Object.create(values || {}), { [itemVar]: newItems[i2], [idxVar]: keys2[i2] }));
  });
  return () => n(() => {
    for (let el of curEls)
      el[_dispose]?.();
    cache = curEls = null;
  });
};
primary["with"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":with");
  return O(() => {
    const values = state.value, subvalues = evaluate(values)?.valueOf();
    for (let k in values)
      if (!subvalues.hasOwnProperty(k))
        subvalues[k] = values[k];
    sprae(el, subvalues);
  });
};
primary["ref"] = (el, expr, state) => {
  state[expr] = el;
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
secondary["render"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":render"), tpl = evaluate(state.value)?.valueOf();
  if (!tpl)
    exprError(new Error("Template not found"), el, expr, ":render");
  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  return sprae(el, state);
};
secondary["id"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":id");
  const update = (v2) => el.id = v2 || v2 === 0 ? v2 : "";
  return O(() => update(evaluate(state.value)?.valueOf()));
};
secondary["class"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":class");
  let initClassName = el.getAttribute("class");
  return O(() => {
    let v2 = evaluate(state.value)?.valueOf();
    let className = [initClassName];
    if (v2) {
      if (typeof v2 === "string")
        className.push(v2);
      else if (Array.isArray(v2))
        className.push(...v2.map((v3) => v3?.valueOf()));
      else
        className.push(...Object.entries(v2).map(([k, v3]) => v3?.valueOf() ? k : ""));
    }
    if (className = className.filter(Boolean).join(" "))
      el.setAttribute("class", className);
    else
      el.removeAttribute("class");
  });
};
secondary["style"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":style");
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";"))
    initStyle += "; ";
  return O(() => {
    let v2 = evaluate(state.value)?.valueOf();
    if (typeof v2 === "string")
      el.setAttribute("style", initStyle + v2);
    else {
      s(() => {
        el.setAttribute("style", initStyle);
        for (let k in v2)
          if (typeof v2[k] !== "symbol")
            el.style.setProperty(k, v2[k]);
      });
    }
  });
};
secondary["text"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":text");
  return O(() => {
    let value = evaluate(state.value)?.valueOf();
    el.textContent = value == null ? "" : value;
  });
};
secondary[""] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":");
  if (evaluate)
    return O(() => {
      let value = evaluate(state.value)?.valueOf();
      for (let key in value)
        attr(el, dashcase(key), value[key]);
    });
};
secondary["value"] = (el, expr, state) => {
  let evaluate = parseExpr(el, expr, ":value");
  let from, to;
  let update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value) => (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to)) : el.type === "checkbox" ? (value) => (el.value = value ? "on" : "", attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
    for (let option in el.options)
      option.removeAttribute("selected");
    el.value = value;
    el.selectedOptions[0]?.setAttribute("selected", "");
  } : (value) => el.value = value;
  return O(() => {
    update(evaluate(state.value)?.valueOf());
  });
};
var directives_default = (el, expr, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parseExpr(el, expr, ":" + name);
  if (!evaluate)
    return;
  if (evt) {
    let off, dispose = O(() => {
      if (off)
        off(), off = null;
      let value = evaluate(state.value)?.valueOf();
      if (value)
        off = on(el, evt, value);
    });
    return () => (off?.(), dispose());
  }
  return O(() => {
    attr(el, name, evaluate(state.value)?.valueOf());
  });
};
var on = (el, e2, fn) => {
  if (!fn)
    return;
  const ctx = { evt: "", target: el, test: () => true };
  ctx.evt = (e2.startsWith("on") ? e2.slice(2) : e2).replace(
    /\.(\w+)?-?([-\w]+)?/g,
    (match, mod, param = "") => (ctx.test = mods[mod]?.(ctx, ...param.split("-")) || ctx.test, "")
  );
  const { evt, target, test, defer, stop, prevent, ...opts } = ctx;
  if (defer)
    fn = defer(fn);
  const cb = (e3) => test(e3) && (stop && e3.stopPropagation(), prevent && e3.preventDefault(), fn.call(target, e3));
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
  outside: (ctx) => (e2) => {
    let target = ctx.target;
    if (target.contains(e2.target))
      return false;
    if (e2.target.isConnected === false)
      return false;
    if (target.offsetWidth < 1 && target.offsetHeight < 1)
      return false;
    return true;
  },
  self: (ctx) => (e2) => e2.target === ctx.target,
  ctrl: (ctx, ...param) => (e2) => keys.ctrl(e2) && param.every((p) => keys[p] ? keys[p](e2) : e2.key === p),
  shift: (ctx, ...param) => (e2) => keys.shift(e2) && param.every((p) => keys[p] ? keys[p](e2) : e2.key === p),
  alt: (ctx, ...param) => (e2) => keys.alt(e2) && param.every((p) => keys[p] ? keys[p](e2) : e2.key === p),
  meta: (ctx, ...param) => (e2) => keys.meta(e2) && param.every((p) => keys[p] ? keys[p](e2) : e2.key === p),
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
  ctrl: (e2) => e2.ctrlKey || e2.key === "Control" || e2.key === "Ctrl",
  shift: (e2) => e2.shiftKey || e2.key === "Shift",
  alt: (e2) => e2.altKey || e2.key === "Alt",
  meta: (e2) => e2.metaKey || e2.key === "Meta" || e2.key === "Command",
  arrow: (e2) => e2.key.startsWith("Arrow"),
  enter: (e2) => e2.key === "Enter",
  escape: (e2) => e2.key.startsWith("Esc"),
  tab: (e2) => e2.key === "Tab",
  space: (e2) => e2.key === "\xA0" || e2.key === "Space" || e2.key === " ",
  backspace: (e2) => e2.key === "Backspace",
  delete: (e2) => e2.key === "Delete",
  digit: (e2) => /^\d$/.test(e2.key),
  letter: (e2) => /^[a-zA-Z]$/.test(e2.key),
  character: (e2) => /^\S$/.test(e2.key)
};
var throttle = (fn, limit) => {
  let pause, planned, block = (e2) => {
    pause = true;
    setTimeout(() => {
      pause = false;
      if (planned)
        return planned = false, block(e2), fn(e2);
    }, limit);
  };
  return (e2) => {
    if (pause)
      return planned = true;
    block(e2);
    return fn(e2);
  };
};
var debounce = (fn, wait) => {
  let timeout;
  return (e2) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      fn(e2);
    }, wait);
  };
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
    try {
      evaluate = evaluatorMemo[expression] = new Function(`__state={}`, `with (__state) { return ${expression.trim()} };`);
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
var _state = Symbol("state");
var _dispose = Symbol.dispose ||= Symbol("dispose");
function sprae(container, values) {
  if (!container.children)
    return;
  if (container[_state]) {
    const state2 = container[_state], prev = state2.peek(), cur = values.valueOf();
    n(() => (Object.assign(prev, cur), state2.value = null, state2.value = prev));
    return container;
  }
  const disposes = [], state = values?.peek ? values : a(values);
  const init = (el, parent = el.parentNode) => {
    for (let name in primary) {
      let attrName = ":" + name;
      if (el.hasAttribute?.(attrName)) {
        let expr = el.getAttribute(attrName);
        el.removeAttribute(attrName);
        disposes.push(primary[name](el, expr, state, name));
        if (el[_state])
          return;
        if (el.parentNode !== parent)
          return false;
      }
    }
    if (el.attributes) {
      for (let i2 = 0; i2 < el.attributes.length; ) {
        let attr2 = el.attributes[i2], prefix = attr2.name[0];
        if (prefix === ":" || prefix === "@") {
          el.removeAttribute(attr2.name);
          let expr = prefix === "@" ? `${attr2.value.includes("await") ? "async" : ""} event=>{${attr2.value}}` : attr2.value, names = attr2.name.slice(1).split(prefix);
          for (let name of names) {
            if (prefix === "@")
              name = `on` + name;
            let dir = secondary[name] || directives_default;
            disposes.push(dir(el, expr, state, name));
          }
        } else
          i2++;
      }
    }
    for (let i2 = 0, child; child = el.children[i2]; i2++) {
      if (init(child, el) === false)
        i2--;
    }
  };
  init(container);
  if (container[_dispose])
    return container;
  const dispose = () => {
    while (disposes.length)
      disposes.shift()?.();
    container[_dispose] = container[_state] = null;
  };
  container[_dispose] = dispose;
  container[_state] = state;
  return container;
}

// src/index.js
var src_default = sprae;
if (document.currentScript)
  sprae(document.documentElement);
export {
  src_default as default
};
