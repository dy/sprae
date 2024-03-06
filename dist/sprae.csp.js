// src/signal.js
var current;
var signal2 = (v, s, obs = /* @__PURE__ */ new Set()) => (s = {
  get value() {
    current?.deps.push(obs.add(current));
    return v;
  },
  set value(val) {
    v = val;
    for (let sub of obs)
      sub(val);
  },
  peek() {
    return v;
  }
}, s.toJSON = s.then = s.toString = s.valueOf = () => s.value, s);
var effect = (fn, teardown, run, deps) => (run = (prev) => {
  if (teardown?.call)
    teardown();
  prev = current, current = run;
  try {
    teardown = fn();
  } finally {
    current = prev;
  }
}, deps = run.deps = [], run(), (dep) => {
  while (dep = deps.pop())
    dep.delete(run);
});
var computed = (fn, s = signal2(), c, e) => (c = {
  get value() {
    e ||= effect(() => s.value = fn());
    return s.value;
  }
}, c.toJSON = c.then = c.toString = c.valueOf = () => c.value, c);
var batch2 = (fn) => fn();
var untracked = (fn, prev) => (prev = current, current = null, fn(), current = prev);
var use = (s) => (signal2 = s.signal, effect = s.effect, computed = s.computed, batch2 = s.batch, untracked = s.untracked);

// src/core.js
var _dispose2 = Symbol.dispose ||= Symbol("dispose");
var directive = {};
var memo = /* @__PURE__ */ new WeakMap();
function sprae2(container, values) {
  if (memo.has(container))
    return batch(() => Object.assign(memo.get(container), values));
  const state = values || {};
  const disposes = [];
  const init = (el, parent = el.parentNode) => {
    if (el.attributes) {
      for (let i = 0; i < el.attributes.length; ) {
        let attr3 = el.attributes[i];
        if (attr3.name[0] === ":") {
          el.removeAttribute(attr3.name);
          let names = attr3.name.slice(1).split(":");
          for (let name of names)
            disposes.push((directive[name] || directive.default)(el, attr3.value, state, name));
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
  memo.set(container, state);
  if (disposes.length)
    container[_dispose2] = () => {
      while (disposes.length)
        disposes.pop()?.();
      memo.delete(container);
    };
  return state;
}
sprae2.use = use;
sprae2.compile = (src) => new Function(`__scope`, `with (__scope) { let __; return ${src} };`);
var evalMemo = {};
var parse = (el, expression, dir) => {
  let evaluate = evalMemo[expression = expression.trim()];
  if (!evaluate) {
    try {
      evaluate = evalMemo[expression] = sprae2.compile(expression);
    } catch (e) {
      return err2(e, el, expression, dir);
    }
  }
  return (state, result) => {
    try {
      result = evaluate(state);
    } catch (e) {
      return err2(e, el, expression, dir);
    }
    return result?.valueOf();
  };
};
var err2 = (error, element, expr2, directive2) => {
  Object.assign(error, { element, expr: expr2 });
  console.warn(`\u2234 ${error.message}

${directive2}=${expr2 ? `"${expr2}"

` : ""}`, element);
  throw error;
};

// directive/if.js
var _else = Symbol("else");
directive.if = (ifEl, expr2, state) => {
  let holder = document.createTextNode(""), check = parse(ifEl, expr2, "if"), cur2, elseEl = ifEl.nextElementSibling, prevPass = ifEl[_else], pass = computed(() => check(state));
  ifEl.replaceWith(cur2 = holder);
  if (elseEl?.hasAttribute(":else")) {
    elseEl.removeAttribute(":else");
    if (elseEl.hasAttribute(":if")) {
      elseEl[_else] = pass;
      elseEl = null;
    } else {
      elseEl.remove();
    }
  } else
    elseEl = null;
  const dispose = effect(() => {
    const el = prevPass?.value ? holder : pass.value ? ifEl : elseEl;
    if (cur2 != el) {
      (cur2[_each] || cur2).replaceWith(cur2 = el || holder);
      if (cur2 !== holder)
        sprae(cur2, state);
    }
  });
  return () => {
    ifEl[_dispose]?.();
    elseEl?.[_dispose]?.();
    dispose();
  };
};

// node_modules/swapdom/swap-inflate.js
var swap = (parent, a, b, end = null) => {
  let i = 0, cur2, next, bi, n = b.length, m = a.length, { remove, same, insert, replace } = swap;
  while (i < n && i < m && same(a[i], b[i]))
    i++;
  while (i < n && i < m && same(b[n - 1], a[m - 1]))
    end = b[--m, --n];
  if (i == m)
    while (i < n)
      insert(end, b[i++], parent);
  else {
    cur2 = a[i];
    while (i < n) {
      bi = b[i++], next = cur2 ? cur2.nextSibling : end;
      if (same(cur2, bi))
        cur2 = next;
      else if (i < n && same(b[i], next))
        replace(cur2, bi, parent), cur2 = next;
      else
        insert(cur2, bi, parent);
    }
    while (!same(cur2, end))
      next = cur2.nextSibling, remove(cur2, parent), cur2 = next;
  }
  return b;
};
swap.same = (a, b) => a == b;
swap.replace = (a, b, parent) => parent.replaceChild(b, a);
swap.insert = (a, b, parent) => parent.insertBefore(b, a);
swap.remove = (a, parent) => parent.removeChild(a);
var swap_inflate_default = swap;

// directive/each.js
var _each2 = Symbol(":each");
directive.each = (tpl, expr2, state) => {
  let [leftSide, itemsExpr] = expr2.split(/\s+in\s+/);
  let [itemVar, idxVar = ""] = leftSide.split(/\s*,\s*/);
  const holder = tpl[_each2] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = parse(tpl, itemsExpr, "each");
  let cur2 = [];
  return effect(() => {
    let items = evaluate(state), els = [];
    if (typeof items === "number")
      items = Array.from({ length: items }, (_, i) => i);
    for (let idx2 in items) {
      let el = tpl.cloneNode(true), substate = Object.create(state, {
        [itemVar]: { value: items[idx2] },
        [idxVar]: { value: idx2 }
      });
      sprae(el, substate);
      els.push(el);
    }
    swap_inflate_default(holder.parentNode, cur2, els, holder);
    cur2 = els;
  });
};

// directive/ref.js
directive.ref = (el, expr2, state) => {
  state[expr2] = el;
};

// directive/scope.js
directive.scope = (el, expr2, rootState) => {
  let evaluate = parse(el, expr2, "scope");
  const localState = evaluate(rootState);
  const state = Object.assign(Object.create(rootState), toSignal(localState));
  sprae(el, state);
  return el[_dispose];
};
var toSignal = (state) => {
  for (let key in state) {
    let v = state[key];
    if (Object(v) === v)
      !v.peek ? toSignal(v) : null;
    else
      state[key] = signal(v);
  }
  return state;
};

// directive/html.js
directive.html = (el, expr2, state) => {
  let evaluate = parse(el, expr2, "html"), tpl = evaluate(state);
  if (!tpl)
    err(new Error("Template not found"), el, expr2, "html");
  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
  return el[_dispose];
};

// directive/text.js
directive.text = (el, expr2, state) => {
  let evaluate = parse(el, expr2, "text");
  return effect(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};

// directive/class.js
directive.class = (el, expr2, state) => {
  let evaluate = parse(el, expr2, "class");
  let initClassName = el.getAttribute("class");
  return effect(() => {
    let v = evaluate(state);
    let className = [initClassName];
    if (v) {
      if (typeof v === "string")
        className.push(v);
      else if (Array.isArray(v))
        className.push(...v);
    }
    if (className = className.filter(Boolean).join(" "))
      el.setAttribute("class", className);
    else
      el.removeAttribute("class");
  });
};

// directive/style.js
directive.style = (el, expr2, state) => {
  let evaluate = parse(el, expr2, "style");
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";"))
    initStyle += "; ";
  return effect(() => {
    let v = evaluate(state);
    if (typeof v === "string")
      el.setAttribute("style", initStyle + v);
    else {
      el.setAttribute("style", initStyle);
      for (let k in v)
        el.style.setProperty(k, v[k]);
    }
  });
};

// directive/value.js
directive.value = (el, expr2, state) => {
  let evaluate = parse(el, expr2, "value");
  let from, to;
  let update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value) => (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to)) : el.type === "checkbox" ? (value) => (el.value = value ? "on" : "", attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
    for (let option in el.options)
      option.removeAttribute("selected");
    el.value = value;
    el.selectedOptions[0]?.setAttribute("selected", "");
  } : (value) => el.value = value;
  return effect(() => {
    update(evaluate(state));
  });
};

// directive/default.js
directive.default = (el, expr2, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parse(el, expr2, ":" + name);
  if (!evaluate)
    return;
  if (evt) {
    let off, dispose = effect(() => {
      if (off)
        off(), off = null;
      off = on(el, evt, evaluate(state));
    });
    return () => (off?.(), dispose());
  }
  return effect(() => {
    attr2(el, name, evaluate(state));
  });
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
  ctrl: (_, ...param) => (e) => keys.ctrl(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  shift: (_, ...param) => (e) => keys.shift(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  alt: (_, ...param) => (e) => keys.alt(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  meta: (_, ...param) => (e) => keys.meta(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
  arrow: () => keys.arrow,
  enter: () => keys.enter,
  escape: () => keys.escape,
  tab: () => keys.tab,
  space: () => keys.space,
  backspace: () => keys.backspace,
  delete: () => keys.delete,
  digit: () => keys.digit,
  letter: () => keys.letter,
  character: () => keys.character
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
var attr2 = (el, name, v) => {
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

// node_modules/subscript/src/const.js
var PERIOD = 46;
var SPACE = 32;
var COLON = 58;
var DQUOTE = 34;
var QUOTE = 39;
var _0 = 48;
var _9 = 57;
var _E = 69;
var _e = 101;
var BSLASH = 92;
var STAR = 42;
var PREC_SEQ = 1;
var PREC_ASSIGN = 2;
var PREC_LOR = 3;
var PREC_LAND = 4;
var PREC_OR = 5;
var PREC_XOR = 6;
var PREC_AND = 7;
var PREC_EQ = 8;
var PREC_COMP = 9;
var PREC_SHIFT = 10;
var PREC_ADD = 11;
var PREC_MULT = 12;
var PREC_EXP = 13;
var PREC_PREFIX = 14;
var PREC_POSTFIX = 15;
var PREC_ACCESS = 17;
var PREC_TOKEN = 20;

// node_modules/subscript/src/parse.js
var idx;
var cur;
var parse2 = (s) => (idx = 0, cur = s, s = expr(), cur[idx] ? err3() : s || "");
var err3 = (msg = "Bad syntax", lines = cur.slice(0, idx).split("\n"), last2 = lines.pop()) => {
  let before = cur.slice(idx - 108, idx).split("\n").pop();
  let after = cur.slice(idx, idx + 108).split("\n").shift();
  throw EvalError(`${msg} at ${lines.length}:${last2.length} \`${idx >= 108 ? "\u2026" : ""}${before}\u25B6${after}\``, "font-weight: bold");
};
var skip = (is = 1, from = idx, l) => {
  if (typeof is == "number")
    idx += is;
  else
    while (l = is(cur.charCodeAt(idx)))
      idx += l;
  return cur.slice(from, idx);
};
var expr = (prec = 0, end, cc, token2, newNode, fn) => {
  while ((cc = parse2.space()) && (newNode = ((fn = lookup[cc]) && fn(token2, prec)) ?? (!token2 && parse2.id())))
    token2 = newNode;
  if (end)
    cc == end ? idx++ : err3();
  return token2;
};
var isId = (c) => c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || c == 36 || c == 95 || c >= 192 && c != 215 && c != 247;
var id = parse2.id = () => skip(isId);
var space = parse2.space = (cc) => {
  while ((cc = cur.charCodeAt(idx)) <= SPACE)
    idx++;
  return cc;
};
var lookup = [];
var token = (op, prec = SPACE, map, c = op.charCodeAt(0), l = op.length, prev = lookup[c], word = op.toUpperCase() !== op) => lookup[c] = (a, curPrec, from = idx) => curPrec < prec && (l < 2 || cur.substr(idx, l) == op) && (!word || !isId(cur.charCodeAt(idx + l))) && (idx += l, map(a, curPrec)) || (idx = from, prev?.(a, curPrec));
var binary = (op, prec, right = false) => token(op, prec, (a, b) => a && (b = expr(prec - (right ? 0.5 : 0))) && [op, a, b]);
var unary = (op, prec, post) => token(op, prec, (a) => post ? a && [op, a] : !a && (a = expr(prec - 0.5)) && [op, a]);
var nary = (op, prec) => {
  token(
    op,
    prec,
    (a, b) => (b = expr(prec), (!a || a[0] !== op) && (a = [op, a]), a.push(b), a)
  );
};
var group = (op, prec) => token(op[0], prec, (a) => !a && [op, expr(0, op.charCodeAt(1))]);
var access = (op, prec) => token(op[0], prec, (a) => a && [op[0], a, expr(0, op.charCodeAt(1))]);
var parse_default = parse2;

// node_modules/subscript/src/compile.js
var compile = (node) => !Array.isArray(node) ? compile.id(node) : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1));
var id2 = compile.id = (name) => (ctx) => ctx?.[name];
var operators = {};
var operator = (op, fn, prev = operators[op]) => operators[op] = (...args) => fn(...args) || prev && prev(...args);
var prop = (a, fn, generic, obj, path) => a[0] === "()" ? prop(a[1], fn, generic) : typeof a === "string" ? (ctx) => fn(ctx, a, ctx) : a[0] === "." ? (obj = compile(a[1]), path = a[2], (ctx) => fn(obj(ctx), path, ctx)) : a[0] === "[" ? (obj = compile(a[1]), path = compile(a[2]), (ctx) => fn(obj(ctx), path(ctx), ctx)) : generic ? (a = compile(a), (ctx) => fn([a(ctx)], 0, ctx)) : () => err3("Bad left value");
var compile_default = compile;

// node_modules/subscript/feature/number.js
var num = (a) => a ? err3() : [, (a = +skip((c) => c === PERIOD || c >= _0 && c <= _9 || (c === _E || c === _e ? 2 : 0))) != a ? err3() : a];
lookup[PERIOD] = (a) => !a && num();
for (let i = _0; i <= _9; i++)
  lookup[i] = num;

// node_modules/subscript/feature/string.js
var escape = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f", v: "\v" };
var string = (q) => (qc, c, str = "") => {
  qc && err3("Unexpected string");
  skip();
  while (c = cur.charCodeAt(idx), c - q) {
    if (c === BSLASH)
      skip(), c = skip(), str += escape[c] || c;
    else
      str += skip();
  }
  skip() || err3("Bad string");
  return [, str];
};
lookup[DQUOTE] = string(DQUOTE);
lookup[QUOTE] = string(QUOTE);

// node_modules/subscript/feature/call.js
access("()", PREC_ACCESS);
operator(
  "(",
  (a, b, args) => (args = !b ? () => [] : b[0] === "," ? (b = b.slice(1).map((b2) => !b2 ? err() : compile(b2)), (ctx) => b.map((arg) => arg(ctx))) : (b = compile(b), (ctx) => [b(ctx)]), prop(a, (obj, path, ctx) => obj[path](...args(ctx)), true))
);

// node_modules/subscript/feature/access.js
access("[]", PREC_ACCESS);
operator("[", (a, b) => !b ? err() : (a = compile(a), b = compile(b), (ctx) => a(ctx)[b(ctx)]));
binary(".", PREC_ACCESS);
operator(".", (a, b) => (a = compile(a), b = !b[0] ? b[1] : b, (ctx) => a(ctx)[b]));

// node_modules/subscript/feature/group.js
group("()", PREC_ACCESS);
operator("()", (a) => (!a && err3("Empty ()"), compile(a)));
var last = (...args) => (args = args.map(compile), (ctx) => args.map((arg) => arg(ctx)).pop());
nary(",", PREC_SEQ), operator(",", last);
nary(";", PREC_SEQ, true), operator(";", last);

// node_modules/subscript/feature/mult.js
binary("*", PREC_MULT), operator("*", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) * b(ctx)));
binary("/", PREC_MULT), operator("/", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) / b(ctx)));
binary("%", PREC_MULT), operator("%", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) % b(ctx)));
binary("*=", PREC_ASSIGN, true);
operator("*=", (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] *= b(ctx))));
binary("/=", PREC_ASSIGN, true);
operator("/=", (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] /= b(ctx))));
binary("%=", PREC_ASSIGN, true);
operator("%=", (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] %= b(ctx))));

// node_modules/subscript/feature/add.js
unary("+", PREC_PREFIX), operator("+", (a, b) => !b && (a = compile(a), (ctx) => +a(ctx)));
unary("-", PREC_PREFIX), operator("-", (a, b) => !b && (a = compile(a), (ctx) => -a(ctx)));
binary("+", PREC_ADD), operator("+", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) + b(ctx)));
binary("-", PREC_ADD), operator("-", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) - b(ctx)));
binary("+=", PREC_ASSIGN, true);
operator("+=", (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] += b(ctx))));
binary("-=", PREC_ASSIGN, true);
operator("-=", (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] -= b(ctx))));

// node_modules/subscript/feature/increment.js
var inc;
var dec;
token("++", PREC_POSTFIX, (a) => a ? ["++-", a] : ["++", expr(PREC_POSTFIX - 1)]);
operator("++", inc = (a) => prop(a, (obj, path, ctx) => ++obj[path]));
operator("++-", inc = (a) => prop(a, (obj, path, ctx) => obj[path]++));
token("--", PREC_POSTFIX, (a) => a ? ["--+", a] : ["--", expr(PREC_POSTFIX - 1)]);
operator("--", dec = (a) => prop(a, (obj, path, ctx) => --obj[path]));
operator("--+", dec = (a) => prop(a, (obj, path, ctx) => obj[path]--));

// node_modules/subscript/feature/bitwise.js
unary("~", PREC_PREFIX), operator("~", (a, b) => !b && (a = compile(a), (ctx) => ~a(ctx)));
binary("|", PREC_OR), operator("|", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) | b(ctx)));
binary("&", PREC_AND), operator("&", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) & b(ctx)));
binary("^", PREC_XOR), operator("^", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) ^ b(ctx)));
binary(">>", PREC_SHIFT), operator(">>", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) >> b(ctx)));
binary("<<", PREC_SHIFT), operator("<<", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) << b(ctx)));

// node_modules/subscript/feature/compare.js
binary("==", PREC_EQ), operator("==", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) == b(ctx)));
binary("!=", PREC_EQ), operator("!=", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) != b(ctx)));
binary(">", PREC_COMP), operator(">", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) > b(ctx)));
binary("<", PREC_COMP), operator("<", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) < b(ctx)));
binary(">=", PREC_COMP), operator(">=", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) >= b(ctx)));
binary("<=", PREC_COMP), operator("<=", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) <= b(ctx)));

// node_modules/subscript/feature/logic.js
unary("!", PREC_PREFIX), operator("!", (a, b) => !b && (a = compile(a), (ctx) => !a(ctx)));
binary("||", PREC_LOR);
operator("||", (a, b) => (a = compile(a), b = compile(b), (ctx) => a(ctx) || b(ctx)));
binary("&&", PREC_LAND);
operator("&&", (a, b) => (a = compile(a), b = compile(b), (ctx) => a(ctx) && b(ctx)));

// node_modules/subscript/feature/assign.js
binary("=", PREC_ASSIGN, true);
operator("=", (a, b) => (b = compile(b), prop(a, (container, path, ctx) => container[path] = b(ctx))));

// node_modules/subscript/subscript.js
var subscript_default = (s) => compile_default(parse_default(s));

// node_modules/subscript/feature/comment.js
token("/*", PREC_TOKEN, (a, prec) => (skip((c) => c !== STAR && cur.charCodeAt(idx + 1) !== 47), skip(2), a || expr(prec) || []));
token("//", PREC_TOKEN, (a, prec) => (skip((c) => c >= SPACE), a || expr(prec) || [""]));

// node_modules/subscript/feature/pow.js
binary("**", PREC_EXP, true), operator("**", (a, b) => b && (a = compile(a), b = compile(b), (ctx) => a(ctx) ** b(ctx)));

// node_modules/subscript/feature/ternary.js
token("?", PREC_ASSIGN, (a, b, c) => a && (b = expr(PREC_ASSIGN, COLON)) && (c = expr(PREC_ASSIGN + 1), ["?", a, b, c]));
operator("?", (a, b, c) => (a = compile(a), b = compile(b), c = compile(c), (ctx) => a(ctx) ? b(ctx) : c(ctx)));

// node_modules/subscript/feature/bool.js
token("true", PREC_TOKEN, (a) => a ? err() : [, true]);
token("false", PREC_TOKEN, (a) => a ? err() : [, false]);

// node_modules/subscript/feature/array.js
group("[]", PREC_TOKEN);
operator("[]", (a, b) => !a ? () => [] : a[0] === "," ? (a = a.slice(1).map(compile), (ctx) => a.map((a2) => a2(ctx))) : (a = compile(a), (ctx) => [a(ctx)]));

// node_modules/subscript/feature/object.js
group("{}", PREC_TOKEN);
operator("{}", (a, b) => !a ? () => ({}) : a[0] === "," ? (a = a.slice(1).map(compile), (ctx) => Object.fromEntries(a.map((a2) => a2(ctx)))) : a[0] === ":" ? (a = compile(a), (ctx) => Object.fromEntries([a(ctx)])) : (b = compile(a), (ctx) => ({ [a]: b(ctx) })));
binary(":", PREC_ASSIGN, true);
operator(":", (a, b) => (b = compile(b), a = Array.isArray(a) ? compile(a) : ((a2) => a2).bind(0, a), (ctx) => [a(ctx), b(ctx)]));

// node_modules/subscript/feature/arrow.js
binary("=>", PREC_ASSIGN, true);
operator(
  "=>",
  (a, b) => (a = a[0] === "()" ? a[1] : a, a = !a ? [] : a[0] === "," ? a = a.slice(1) : a = [a], b = compile(b[0] === "{}" ? b[1] : b), (ctx = null) => (ctx = Object.create(ctx), (...args) => (a.map((a2, i) => ctx[a2] = args[i]), b(ctx))))
);
binary("");

// node_modules/subscript/feature/optional.js
token("?.", PREC_ACCESS, (a) => a && ["?.", a]);
operator("?.", (a) => (a = compile(a), (ctx) => a(ctx) || (() => {
})));
token("?.", PREC_ACCESS, (a, b) => a && (b = expr(PREC_ACCESS), !b?.map) && ["?.", a, b]);
operator("?.", (a, b) => b && (a = compile(a), (ctx) => a(ctx)?.[b]));
operator("(", (a, b, container, args, path, optional) => a[0] === "?." && (a[2] || Array.isArray(a[1])) && (args = !b ? () => [] : b[0] === "," ? (b = b.slice(1).map(compile), (ctx) => b.map((a2) => a2(ctx))) : (b = compile(b), (ctx) => [b(ctx)]), !a[2] && (optional = true, a = a[1]), a[0] === "[" ? path = compile(a[2]) : path = () => a[2], container = compile(a[1]), optional ? (ctx) => container(ctx)?.[path(ctx)]?.(...args(ctx)) : (ctx) => container(ctx)?.[path(ctx)](...args(ctx))));

// node_modules/subscript/justin.js
binary("in", PREC_COMP), operator("in", (a, b) => b && (a = compile_default(a), b = compile_default(b), (ctx) => a(ctx) in b(ctx)));
binary("===", PREC_EQ), binary("!==", 9);
operator("===", (a, b) => (a = compile_default(a), b = compile_default(b), (ctx) => a(ctx) === b(ctx)));
operator("===", (a, b) => (a = compile_default(a), b = compile_default(b), (ctx) => a(ctx) !== b(ctx)));
binary("??", PREC_LOR);
operator("??", (a, b) => b && (a = compile_default(a), b = compile_default(b), (ctx) => a(ctx) ?? b(ctx)));
binary("??=", PREC_ASSIGN, true);
operator("??=", (a, b) => (b = compile_default(b), prop(a, (obj, path, ctx) => obj[path] ??= b(ctx))));
binary("||=", PREC_ASSIGN, true);
operator("||=", (a, b) => (b = compile_default(b), prop(a, (obj, path, ctx) => obj[path] ||= b(ctx))));
binary("&&=", PREC_ASSIGN, true);
operator("&&=", (a, b) => (b = compile_default(b), prop(a, (obj, path, ctx) => obj[path] &&= b(ctx))));
token("undefined", 20, (a) => a ? err3() : [, void 0]);
token("NaN", 20, (a) => a ? err3() : [, NaN]);
token("null", 20, (a) => a ? err3() : [, null]);
var justin_default = subscript_default;

// sprae.csp.js
sprae2.compile = justin_default;
var sprae_csp_default = sprae2;
export {
  batch2 as batch,
  computed,
  sprae_csp_default as default,
  effect,
  signal2 as signal
};
