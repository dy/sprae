var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
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

// node_modules/ulive/dist/ulive.es.js
var ulive_es_exports = {};
__export(ulive_es_exports, {
  batch: () => batch,
  computed: () => computed,
  current: () => current,
  effect: () => effect,
  signal: () => signal,
  untracked: () => untracked
});
var current;
var signal = (v, s, obs = /* @__PURE__ */ new Set()) => (s = {
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
var effect = (fn, teardown, run, deps) => (run = (prev) => {
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
var computed = (fn, s = signal(), c, e) => (c = {
  get value() {
    e ||= effect(() => s.value = fn());
    return s.value;
  },
  peek: s.peek
}, c.toJSON = c.then = c.toString = c.valueOf = () => c.value, c);
var batch = (fn) => fn();
var untracked = (fn, prev, v) => (prev = current, current = null, v = fn(), current = prev, v);

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
var parse = (s) => (idx = 0, cur = s, s = expr(), cur[idx] ? err2() : s || "");
var err2 = (msg = "Bad syntax", lines = cur.slice(0, idx).split("\n"), last2 = lines.pop()) => {
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
  while ((cc = parse.space()) && (newNode = ((fn = lookup[cc]) && fn(token2, prec)) ?? (!token2 && parse.id())))
    token2 = newNode;
  if (end)
    cc == end ? idx++ : err2();
  return token2;
};
var isId = (c) => c >= 48 && c <= 57 || c >= 65 && c <= 90 || c >= 97 && c <= 122 || c == 36 || c == 95 || c >= 192 && c != 215 && c != 247;
var id = parse.id = () => skip(isId);
var space = parse.space = (cc) => {
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
var parse_default = parse;

// node_modules/subscript/src/compile.js
var compile = (node) => !Array.isArray(node) ? compile.id(node) : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1));
var id2 = compile.id = (name) => (ctx) => ctx?.[name];
var operators = {};
var operator = (op, fn, prev = operators[op]) => operators[op] = (...args) => fn(...args) || prev && prev(...args);
var prop = (a, fn, generic, obj, path) => a[0] === "()" ? prop(a[1], fn, generic) : typeof a === "string" ? (ctx) => fn(ctx, a, ctx) : a[0] === "." ? (obj = compile(a[1]), path = a[2], (ctx) => fn(obj(ctx), path, ctx)) : a[0] === "[" ? (obj = compile(a[1]), path = compile(a[2]), (ctx) => fn(obj(ctx), path(ctx), ctx)) : generic ? (a = compile(a), (ctx) => fn([a(ctx)], 0, ctx)) : () => err2("Bad left value");
var compile_default = compile;

// node_modules/subscript/feature/number.js
var num = (a) => a ? err2() : [, (a = +skip((c) => c === PERIOD || c >= _0 && c <= _9 || (c === _E || c === _e ? 2 : 0))) != a ? err2() : a];
lookup[PERIOD] = (a) => !a && num();
for (let i = _0; i <= _9; i++)
  lookup[i] = num;

// node_modules/subscript/feature/string.js
var escape = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f", v: "\v" };
var string = (q) => (qc, c, str = "") => {
  qc && err2("Unexpected string");
  skip();
  while (c = cur.charCodeAt(idx), c - q) {
    if (c === BSLASH)
      skip(), c = skip(), str += escape[c] || c;
    else
      str += skip();
  }
  skip() || err2("Bad string");
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
operator("()", (a) => (!a && err2("Empty ()"), compile(a)));
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
token("undefined", 20, (a) => a ? err2() : [, void 0]);
token("NaN", 20, (a) => a ? err2() : [, NaN]);
token("null", 20, (a) => a ? err2() : [, null]);
var justin_default = subscript_default;

// core.js
var _dispose = Symbol.dispose ||= Symbol("dispose");
var SPRAE = `\u2234`;
var { signal: signal2, effect: effect2, batch: batch2, computed: computed2, untracked: untracked2 } = ulive_es_exports;
var directive = {};
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  if (memo.has(container)) {
    const [state2, effects2] = memo.get(container);
    for (let k in values)
      state2[k] = values[k];
    for (let fx of effects2)
      fx();
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
            let update = (directive[name] || directive.default)(el, attr2.value, state, name);
            if (update) {
              update[_dispose] = effect2(update);
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
var compile2 = (expr2, dir, evaluate) => {
  if (evaluate = evalMemo[expr2 = expr2.trim()])
    return evaluate;
  try {
    evaluate = justin_default(expr2);
  } catch (e) {
    throw Object.assign(e, { message: `${SPRAE} ${e.message}

${dir}${expr2 ? `="${expr2}"

` : ""}`, expr: expr2 });
  }
  return evalMemo[expr2] = evaluate;
};
var swap2 = swap_inflate_default;
var ipol = (v, state) => {
  return v?.replace ? v.replace(/\$<([^>]+)>/g, (match, field) => state[field]?.valueOf?.() ?? "") : v;
};
sprae.use = (s) => {
  s.signal && (signal2 = s.signal, effect2 = s.effect, computed2 = s.computed, batch2 = s.batch || ((fn) => fn()), untracked2 = s.untracked || batch2);
  s.swap && (swap2 = s.swap);
};

// directive/each.js
var _each = Symbol(":each");
var keys = {};
directive.each = (tpl, expr2, state, name) => {
  let [leftSide, itemsExpr] = expr2.split(/\s+in\s+/);
  let [itemVar, idxVar = "_$"] = leftSide.split(/\s*,\s*/);
  const holder = tpl[_each] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = compile2(itemsExpr, name);
  const memo2 = /* @__PURE__ */ new WeakMap();
  tpl.removeAttribute(":key");
  let cur2 = [];
  return () => {
    let items = evaluate(state)?.valueOf(), els = [];
    if (typeof items === "number")
      items = Array.from({ length: items }, (_, i) => i);
    const count = /* @__PURE__ */ new WeakSet();
    for (let idx2 in items) {
      let item = items[idx2];
      let substate = Object.create(state, { [idxVar]: { value: idx2 } });
      substate[itemVar] = item;
      item = item.peek?.() ?? item;
      let key = item.key ?? item.id ?? item;
      let el;
      if (key == null)
        el = tpl.cloneNode(true);
      else {
        if (Object(key) !== key)
          key = keys[key] ||= Object(key);
        if (count.has(key)) {
          console.warn("Duplicate key", key), el = tpl.cloneNode(true);
        } else {
          console.log(key, count.has(key));
          count.add(key);
          el = memo2.get(key) || memo2.set(key, tpl.cloneNode(true)).get(key);
        }
      }
      if (el.content)
        el = el.content.cloneNode(true);
      sprae(el, substate);
      if (el.nodeType === 11)
        els.push(...el.childNodes);
      else
        els.push(el);
    }
    swap2(holder.parentNode, cur2, cur2 = els, holder);
  };
};

// directive/if.js
var _prevIf = Symbol("if");
directive.if = (ifEl, expr2, state, name) => {
  let parent = ifEl.parentNode, next = ifEl.nextElementSibling, holder = document.createTextNode(""), evaluate = compile2(expr2, name), cur2, ifs, elses, none = [];
  ifEl.after(holder);
  if (ifEl.content)
    cur2 = none, ifEl.remove(), ifs = [...ifEl.content.childNodes];
  else
    ifs = cur2 = [ifEl];
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
    if (cur2 != newEls) {
      if (cur2[0]?.[_each])
        cur2 = [cur2[0][_each]];
      swap2(parent, cur2, cur2 = newEls, holder);
      for (let el of cur2)
        sprae(el, state);
    }
  };
};

// directive/ref.js
directive.ref = (el, expr2, state) => {
  let prev;
  return () => {
    if (prev)
      delete state[prev];
    state[prev = ipol(expr2, state)] = el;
  };
};

// directive/scope.js
directive.scope = (el, expr2, rootState, name) => {
  let evaluate = compile2(expr2, name);
  return () => {
    sprae(el, { ...rootState, ...evaluate(rootState)?.valueOf?.() || {} });
  };
};

// directive/html.js
directive.html = (el, expr2, state, name) => {
  let evaluate = compile2(expr2, name), tpl = evaluate(state);
  if (!tpl)
    return;
  let content = (tpl.content || tpl).cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
};

// directive/text.js
directive.text = (el, expr2, state) => {
  let evaluate = compile2(expr2, "text");
  if (el.content)
    el.replaceWith(el = document.createTextNode(""));
  return () => {
    let value = evaluate(state)?.valueOf();
    el.textContent = value == null ? "" : value;
  };
};

// directive/class.js
directive.class = (el, expr2, state) => {
  let evaluate = compile2(expr2, "class");
  let cur2 = /* @__PURE__ */ new Set();
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
    for (let cls of cur2)
      if (clsx.has(cls))
        clsx.delete(cls);
      else
        el.classList.remove(cls);
    for (let cls of cur2 = clsx)
      el.classList.add(cls);
  };
};

// directive/style.js
directive.style = (el, expr2, state) => {
  let evaluate = compile2(expr2, "style");
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
directive.default = (el, expr2, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = compile2(expr2, name);
  if (evt) {
    let off;
    return () => (off?.(), off = on(el, evt, evaluate(state)));
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
directive.value = (el, expr2, state) => {
  let evaluate = compile2(expr2, "value");
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
directive.fx = (el, expr2, state, name) => {
  let evaluate = compile2(expr2, name);
  return () => evaluate(state);
};
export {
  batch2 as batch,
  compile2 as compile,
  computed2 as computed,
  sprae as default,
  directive,
  effect2 as effect,
  ipol,
  signal2 as signal,
  swap2 as swap,
  untracked2 as untracked
};
