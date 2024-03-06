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
var parse = (s2) => (idx = 0, cur = s2, s2 = expr(), cur[idx] ? err2() : s2 || "");
var err2 = (msg = "Bad syntax", lines = cur.slice(0, idx).split("\n"), last2 = lines.pop()) => {
  let before = cur.slice(idx - 108, idx).split("\n").pop();
  let after = cur.slice(idx, idx + 108).split("\n").shift();
  throw EvalError(`${msg} at ${lines.length}:${last2.length} \`${idx >= 108 ? "\u2026" : ""}${before}\u25B6${after}\``, "font-weight: bold");
};
var skip = (is = 1, from = idx, l2) => {
  if (typeof is == "number")
    idx += is;
  else
    while (l2 = is(cur.charCodeAt(idx)))
      idx += l2;
  return cur.slice(from, idx);
};
var expr = (prec = 0, end, cc, token2, newNode, fn) => {
  while ((cc = parse.space()) && (newNode = ((fn = lookup[cc]) && fn(token2, prec)) ?? (!token2 && parse.id())))
    token2 = newNode;
  if (end)
    cc == end ? idx++ : err2();
  return token2;
};
var isId = (c2) => c2 >= 48 && c2 <= 57 || c2 >= 65 && c2 <= 90 || c2 >= 97 && c2 <= 122 || c2 == 36 || c2 == 95 || c2 >= 192 && c2 != 215 && c2 != 247;
var id = parse.id = () => skip(isId);
var space = parse.space = (cc) => {
  while ((cc = cur.charCodeAt(idx)) <= SPACE)
    idx++;
  return cc;
};
var lookup = [];
var token = (op, prec = SPACE, map, c2 = op.charCodeAt(0), l2 = op.length, prev = lookup[c2], word = op.toUpperCase() !== op) => lookup[c2] = (a2, curPrec, from = idx) => curPrec < prec && (l2 < 2 || cur.substr(idx, l2) == op) && (!word || !isId(cur.charCodeAt(idx + l2))) && (idx += l2, map(a2, curPrec)) || (idx = from, prev?.(a2, curPrec));
var binary = (op, prec, right = false) => token(op, prec, (a2, b2) => a2 && (b2 = expr(prec - (right ? 0.5 : 0))) && [op, a2, b2]);
var unary = (op, prec, post) => token(op, prec, (a2) => post ? a2 && [op, a2] : !a2 && (a2 = expr(prec - 0.5)) && [op, a2]);
var nary = (op, prec) => {
  token(
    op,
    prec,
    (a2, b2) => (b2 = expr(prec), (!a2 || a2[0] !== op) && (a2 = [op, a2]), a2.push(b2), a2)
  );
};
var group = (op, prec) => token(op[0], prec, (a2) => !a2 && [op, expr(0, op.charCodeAt(1))]);
var access = (op, prec) => token(op[0], prec, (a2) => a2 && [op[0], a2, expr(0, op.charCodeAt(1))]);
var parse_default = parse;

// node_modules/subscript/src/compile.js
var compile = (node) => !Array.isArray(node) ? compile.id(node) : !node[0] ? () => node[1] : operators[node[0]](...node.slice(1));
var id2 = compile.id = (name) => (ctx) => ctx?.[name];
var operators = {};
var operator = (op, fn, prev = operators[op]) => operators[op] = (...args) => fn(...args) || prev && prev(...args);
var prop2 = (a2, fn, generic, obj, path) => a2[0] === "()" ? prop2(a2[1], fn, generic) : typeof a2 === "string" ? (ctx) => fn(ctx, a2, ctx) : a2[0] === "." ? (obj = compile(a2[1]), path = a2[2], (ctx) => fn(obj(ctx), path, ctx)) : a2[0] === "[" ? (obj = compile(a2[1]), path = compile(a2[2]), (ctx) => fn(obj(ctx), path(ctx), ctx)) : generic ? (a2 = compile(a2), (ctx) => fn([a2(ctx)], 0, ctx)) : () => err2("Bad left value");
var compile_default = compile;

// node_modules/subscript/feature/number.js
var num = (a2) => a2 ? err2() : [, (a2 = +skip((c2) => c2 === PERIOD || c2 >= _0 && c2 <= _9 || (c2 === _E || c2 === _e ? 2 : 0))) != a2 ? err2() : a2];
lookup[PERIOD] = (a2) => !a2 && num();
for (let i2 = _0; i2 <= _9; i2++)
  lookup[i2] = num;

// node_modules/subscript/feature/string.js
var escape = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f", v: "\v" };
var string = (q) => (qc, c2, str = "") => {
  qc && err2("Unexpected string");
  skip();
  while (c2 = cur.charCodeAt(idx), c2 - q) {
    if (c2 === BSLASH)
      skip(), c2 = skip(), str += escape[c2] || c2;
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
  (a2, b2, args) => (args = !b2 ? () => [] : b2[0] === "," ? (b2 = b2.slice(1).map((b3) => !b3 ? err() : compile(b3)), (ctx) => b2.map((arg) => arg(ctx))) : (b2 = compile(b2), (ctx) => [b2(ctx)]), prop2(a2, (obj, path, ctx) => obj[path](...args(ctx)), true))
);

// node_modules/subscript/feature/access.js
access("[]", PREC_ACCESS);
operator("[", (a2, b2) => !b2 ? err() : (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx)[b2(ctx)]));
binary(".", PREC_ACCESS);
operator(".", (a2, b2) => (a2 = compile(a2), b2 = !b2[0] ? b2[1] : b2, (ctx) => a2(ctx)[b2]));

// node_modules/subscript/feature/group.js
group("()", PREC_ACCESS);
operator("()", (a2) => (!a2 && err2("Empty ()"), compile(a2)));
var last = (...args) => (args = args.map(compile), (ctx) => args.map((arg) => arg(ctx)).pop());
nary(",", PREC_SEQ), operator(",", last);
nary(";", PREC_SEQ, true), operator(";", last);

// node_modules/subscript/feature/mult.js
binary("*", PREC_MULT), operator("*", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) * b2(ctx)));
binary("/", PREC_MULT), operator("/", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) / b2(ctx)));
binary("%", PREC_MULT), operator("%", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) % b2(ctx)));
binary("*=", PREC_ASSIGN, true);
operator("*=", (a2, b2) => (b2 = compile(b2), prop2(a2, (container, path, ctx) => container[path] *= b2(ctx))));
binary("/=", PREC_ASSIGN, true);
operator("/=", (a2, b2) => (b2 = compile(b2), prop2(a2, (container, path, ctx) => container[path] /= b2(ctx))));
binary("%=", PREC_ASSIGN, true);
operator("%=", (a2, b2) => (b2 = compile(b2), prop2(a2, (container, path, ctx) => container[path] %= b2(ctx))));

// node_modules/subscript/feature/add.js
unary("+", PREC_PREFIX), operator("+", (a2, b2) => !b2 && (a2 = compile(a2), (ctx) => +a2(ctx)));
unary("-", PREC_PREFIX), operator("-", (a2, b2) => !b2 && (a2 = compile(a2), (ctx) => -a2(ctx)));
binary("+", PREC_ADD), operator("+", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) + b2(ctx)));
binary("-", PREC_ADD), operator("-", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) - b2(ctx)));
binary("+=", PREC_ASSIGN, true);
operator("+=", (a2, b2) => (b2 = compile(b2), prop2(a2, (container, path, ctx) => container[path] += b2(ctx))));
binary("-=", PREC_ASSIGN, true);
operator("-=", (a2, b2) => (b2 = compile(b2), prop2(a2, (container, path, ctx) => container[path] -= b2(ctx))));

// node_modules/subscript/feature/increment.js
var inc;
var dec;
token("++", PREC_POSTFIX, (a2) => a2 ? ["++-", a2] : ["++", expr(PREC_POSTFIX - 1)]);
operator("++", inc = (a2) => prop2(a2, (obj, path, ctx) => ++obj[path]));
operator("++-", inc = (a2) => prop2(a2, (obj, path, ctx) => obj[path]++));
token("--", PREC_POSTFIX, (a2) => a2 ? ["--+", a2] : ["--", expr(PREC_POSTFIX - 1)]);
operator("--", dec = (a2) => prop2(a2, (obj, path, ctx) => --obj[path]));
operator("--+", dec = (a2) => prop2(a2, (obj, path, ctx) => obj[path]--));

// node_modules/subscript/feature/bitwise.js
unary("~", PREC_PREFIX), operator("~", (a2, b2) => !b2 && (a2 = compile(a2), (ctx) => ~a2(ctx)));
binary("|", PREC_OR), operator("|", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) | b2(ctx)));
binary("&", PREC_AND), operator("&", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) & b2(ctx)));
binary("^", PREC_XOR), operator("^", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) ^ b2(ctx)));
binary(">>", PREC_SHIFT), operator(">>", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) >> b2(ctx)));
binary("<<", PREC_SHIFT), operator("<<", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) << b2(ctx)));

// node_modules/subscript/feature/compare.js
binary("==", PREC_EQ), operator("==", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) == b2(ctx)));
binary("!=", PREC_EQ), operator("!=", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) != b2(ctx)));
binary(">", PREC_COMP), operator(">", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) > b2(ctx)));
binary("<", PREC_COMP), operator("<", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) < b2(ctx)));
binary(">=", PREC_COMP), operator(">=", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) >= b2(ctx)));
binary("<=", PREC_COMP), operator("<=", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) <= b2(ctx)));

// node_modules/subscript/feature/logic.js
unary("!", PREC_PREFIX), operator("!", (a2, b2) => !b2 && (a2 = compile(a2), (ctx) => !a2(ctx)));
binary("||", PREC_LOR);
operator("||", (a2, b2) => (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) || b2(ctx)));
binary("&&", PREC_LAND);
operator("&&", (a2, b2) => (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) && b2(ctx)));

// node_modules/subscript/feature/assign.js
binary("=", PREC_ASSIGN, true);
operator("=", (a2, b2) => (b2 = compile(b2), prop2(a2, (container, path, ctx) => container[path] = b2(ctx))));

// node_modules/subscript/subscript.js
var subscript_default = (s2) => compile_default(parse_default(s2));

// node_modules/subscript/feature/comment.js
token("/*", PREC_TOKEN, (a2, prec) => (skip((c2) => c2 !== STAR && cur.charCodeAt(idx + 1) !== 47), skip(2), a2 || expr(prec) || []));
token("//", PREC_TOKEN, (a2, prec) => (skip((c2) => c2 >= SPACE), a2 || expr(prec) || [""]));

// node_modules/subscript/feature/pow.js
binary("**", PREC_EXP, true), operator("**", (a2, b2) => b2 && (a2 = compile(a2), b2 = compile(b2), (ctx) => a2(ctx) ** b2(ctx)));

// node_modules/subscript/feature/ternary.js
token("?", PREC_ASSIGN, (a2, b2, c2) => a2 && (b2 = expr(PREC_ASSIGN, COLON)) && (c2 = expr(PREC_ASSIGN + 1), ["?", a2, b2, c2]));
operator("?", (a2, b2, c2) => (a2 = compile(a2), b2 = compile(b2), c2 = compile(c2), (ctx) => a2(ctx) ? b2(ctx) : c2(ctx)));

// node_modules/subscript/feature/bool.js
token("true", PREC_TOKEN, (a2) => a2 ? err() : [, true]);
token("false", PREC_TOKEN, (a2) => a2 ? err() : [, false]);

// node_modules/subscript/feature/array.js
group("[]", PREC_TOKEN);
operator("[]", (a2, b2) => !a2 ? () => [] : a2[0] === "," ? (a2 = a2.slice(1).map(compile), (ctx) => a2.map((a3) => a3(ctx))) : (a2 = compile(a2), (ctx) => [a2(ctx)]));

// node_modules/subscript/feature/object.js
group("{}", PREC_TOKEN);
operator("{}", (a2, b2) => !a2 ? () => ({}) : a2[0] === "," ? (a2 = a2.slice(1).map(compile), (ctx) => Object.fromEntries(a2.map((a3) => a3(ctx)))) : a2[0] === ":" ? (a2 = compile(a2), (ctx) => Object.fromEntries([a2(ctx)])) : (b2 = compile(a2), (ctx) => ({ [a2]: b2(ctx) })));
binary(":", PREC_ASSIGN, true);
operator(":", (a2, b2) => (b2 = compile(b2), a2 = Array.isArray(a2) ? compile(a2) : ((a3) => a3).bind(0, a2), (ctx) => [a2(ctx), b2(ctx)]));

// node_modules/subscript/feature/arrow.js
binary("=>", PREC_ASSIGN, true);
operator(
  "=>",
  (a2, b2) => (a2 = a2[0] === "()" ? a2[1] : a2, a2 = !a2 ? [] : a2[0] === "," ? a2 = a2.slice(1) : a2 = [a2], b2 = compile(b2[0] === "{}" ? b2[1] : b2), (ctx = null) => (ctx = Object.create(ctx), (...args) => (a2.map((a3, i2) => ctx[a3] = args[i2]), b2(ctx))))
);
binary("");

// node_modules/subscript/feature/optional.js
token("?.", PREC_ACCESS, (a2) => a2 && ["?.", a2]);
operator("?.", (a2) => (a2 = compile(a2), (ctx) => a2(ctx) || (() => {
})));
token("?.", PREC_ACCESS, (a2, b2) => a2 && (b2 = expr(PREC_ACCESS), !b2?.map) && ["?.", a2, b2]);
operator("?.", (a2, b2) => b2 && (a2 = compile(a2), (ctx) => a2(ctx)?.[b2]));
operator("(", (a2, b2, container, args, path, optional) => a2[0] === "?." && (a2[2] || Array.isArray(a2[1])) && (args = !b2 ? () => [] : b2[0] === "," ? (b2 = b2.slice(1).map(compile), (ctx) => b2.map((a3) => a3(ctx))) : (b2 = compile(b2), (ctx) => [b2(ctx)]), !a2[2] && (optional = true, a2 = a2[1]), a2[0] === "[" ? path = compile(a2[2]) : path = () => a2[2], container = compile(a2[1]), optional ? (ctx) => container(ctx)?.[path(ctx)]?.(...args(ctx)) : (ctx) => container(ctx)?.[path(ctx)](...args(ctx))));

// node_modules/subscript/justin.js
binary("in", PREC_COMP), operator("in", (a2, b2) => b2 && (a2 = compile_default(a2), b2 = compile_default(b2), (ctx) => a2(ctx) in b2(ctx)));
binary("===", PREC_EQ), binary("!==", 9);
operator("===", (a2, b2) => (a2 = compile_default(a2), b2 = compile_default(b2), (ctx) => a2(ctx) === b2(ctx)));
operator("===", (a2, b2) => (a2 = compile_default(a2), b2 = compile_default(b2), (ctx) => a2(ctx) !== b2(ctx)));
binary("??", PREC_LOR);
operator("??", (a2, b2) => b2 && (a2 = compile_default(a2), b2 = compile_default(b2), (ctx) => a2(ctx) ?? b2(ctx)));
binary("??=", PREC_ASSIGN, true);
operator("??=", (a2, b2) => (b2 = compile_default(b2), prop(a2, (obj, path, ctx) => obj[path] ??= b2(ctx))));
binary("||=", PREC_ASSIGN, true);
operator("||=", (a2, b2) => (b2 = compile_default(b2), prop(a2, (obj, path, ctx) => obj[path] ||= b2(ctx))));
binary("&&=", PREC_ASSIGN, true);
operator("&&=", (a2, b2) => (b2 = compile_default(b2), prop(a2, (obj, path, ctx) => obj[path] &&= b2(ctx))));
token("undefined", 20, (a2) => a2 ? err2() : [, void 0]);
token("NaN", 20, (a2) => a2 ? err2() : [, NaN]);
token("null", 20, (a2) => a2 ? err2() : [, null]);
var justin_default = subscript_default;

// src/compile.js
compile.id = (id3) => (ctx) => ctx[id3]?.valueOf();
var assign = (fn, a2, b2) => (b2 = compile(b2), prop2(
  a2,
  (obj, path, ctx) => obj[path]?.peek ? fn(obj[path], "value", b2(ctx)) : fn(obj, path, path in obj ? b2(ctx) : a(b2(ctx)))
));
operator(
  "=",
  assign.bind(0, (obj, path, value) => obj[path] = value)
);
operator(
  "+=",
  assign.bind(0, (obj, path, value) => obj[path] += value)
);
operator(
  "-=",
  assign.bind(0, (obj, path, value) => obj[path] -= value)
);
operator(
  "*=",
  assign.bind(0, (obj, path, value) => obj[path] *= value)
);
operator(
  "/=",
  assign.bind(0, (obj, path, value) => obj[path] /= value)
);
operator(
  "%=",
  assign.bind(0, (obj, path, value) => obj[path] %= value)
);
var compile_default2 = justin_default;

// node_modules/swapdom/swap-inflate.js
var swap = (parent, a2, b2, end = null) => {
  let i2 = 0, cur2, next, bi, n2 = b2.length, m = a2.length, { remove, same, insert, replace } = swap;
  while (i2 < n2 && i2 < m && same(a2[i2], b2[i2]))
    i2++;
  while (i2 < n2 && i2 < m && same(b2[n2 - 1], a2[m - 1]))
    end = b2[--m, --n2];
  if (i2 == m)
    while (i2 < n2)
      insert(end, b2[i2++], parent);
  else {
    cur2 = a2[i2];
    while (i2 < n2) {
      bi = b2[i2++], next = cur2 ? cur2.nextSibling : end;
      if (same(cur2, bi))
        cur2 = next;
      else if (i2 < n2 && same(b2[i2], next))
        replace(cur2, bi, parent), cur2 = next;
      else
        insert(cur2, bi, parent);
    }
    while (!same(cur2, end))
      next = cur2.nextSibling, remove(cur2, parent), cur2 = next;
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
var _else = Symbol("else");
primary["if"] = (ifEl, expr2, state) => {
  let holder = document.createTextNode(""), check = parseExpr(ifEl, expr2, ":if"), cur2, elseEl = ifEl.nextElementSibling, prevPass = ifEl[_else], pass = p(() => check(state));
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
  const dispose = O(() => {
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
var _each = Symbol(":each");
primary["each"] = (tpl, expr2, state) => {
  let [leftSide, itemsExpr] = expr2.split(/\s+in\s+/);
  let [itemVar, idxVar = ""] = leftSide.split(/\s*,\s*/);
  const holder = tpl[_each] = document.createTextNode("");
  tpl.replaceWith(holder);
  const evaluate = parseExpr(tpl, itemsExpr, ":each");
  let cur2 = [];
  return O(() => {
    let items = evaluate(state), els = [];
    if (typeof items === "number")
      items = Array.from({ length: items }, (_2, i2) => i2);
    for (let idx2 in items) {
      let el = tpl.cloneNode(true), substate = Object.create(state, {
        [itemVar]: { value: items[idx2] },
        [idxVar]: { value: idx2 }
      });
      s(() => sprae(el, substate));
      els.push(el);
    }
    swap_inflate_default(holder.parentNode, cur2, els, holder);
    cur2 = els;
  });
};
primary["scope"] = (el, expr2, rootState) => {
  let evaluate = parseExpr(el, expr2, ":scope");
  const localState = evaluate(rootState);
  const state = Object.assign(Object.create(rootState), toSignal(localState));
  sprae(el, state);
  return el[_dispose];
};
var toSignal = (state) => {
  for (let key in state) {
    let v2 = state[key];
    if (v2?.peek || typeof v2 === "function")
      ;
    else if (isPlainObject(v2))
      toSignal(v2);
    else
      state[key] = a(v2);
  }
  return state;
};
var isPlainObject = (value) => !!value && typeof value === "object" && value.constructor === Object;
primary["ref"] = (el, expr2, state) => {
  state[expr2] = el;
};
secondary["html"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":html"), tpl = evaluate(state);
  if (!tpl)
    exprError(new Error("Template not found"), el, expr2, ":html");
  let content = tpl.content.cloneNode(true);
  el.replaceChildren(content);
  sprae(el, state);
  return el[_dispose];
};
secondary["id"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":id");
  const update = (v2) => el.id = v2 || v2 === 0 ? v2 : "";
  return O(() => update(evaluate(state)));
};
secondary["class"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":class");
  let initClassName = el.getAttribute("class");
  return O(() => {
    let v2 = evaluate(state);
    let className = [initClassName];
    if (v2) {
      if (typeof v2 === "string")
        className.push(v2);
      else if (Array.isArray(v2))
        className.push(...v2);
      else {
        className.push(...Object.entries(v2).map(([k, v3]) => v3 ? k : ""));
      }
    }
    if (className = className.filter(Boolean).join(" "))
      el.setAttribute("class", className);
    else
      el.removeAttribute("class");
  });
};
secondary["style"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":style");
  let initStyle = el.getAttribute("style") || "";
  if (!initStyle.endsWith(";"))
    initStyle += "; ";
  return O(() => {
    let v2 = evaluate(state);
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
secondary["text"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":text");
  return O(() => {
    let value = evaluate(state);
    el.textContent = value == null ? "" : value;
  });
};
secondary[""] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":");
  if (evaluate)
    return O(() => {
      let value = evaluate(state);
      for (let key in value)
        attr(el, dashcase(key), value[key]);
    });
};
secondary["fx"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":");
  if (evaluate)
    return O(() => {
      evaluate(state);
    });
};
secondary["value"] = (el, expr2, state) => {
  let evaluate = parseExpr(el, expr2, ":value");
  let from, to;
  let update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value) => (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to)) : el.type === "checkbox" ? (value) => (el.value = value ? "on" : "", attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
    for (let option in el.options)
      option.removeAttribute("selected");
    el.value = value;
    el.selectedOptions[0]?.setAttribute("selected", "");
  } : (value) => el.value = value;
  return O(() => {
    update(evaluate(state));
  });
};
var directives_default = (el, expr2, state, name) => {
  let evt = name.startsWith("on") && name.slice(2);
  let evaluate = parseExpr(el, expr2, ":" + name);
  if (!evaluate)
    return;
  if (evt) {
    let off, dispose = O(() => {
      if (off)
        off(), off = null;
      off = on(el, evt, evaluate(state));
    });
    return () => (off?.(), dispose());
  }
  state = Object.create(state, { this: { value: el } });
  return O(() => {
    attr(el, name, evaluate(state));
  });
};
var on = (el, e2, fn = () => {
}) => {
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
  ctrl: (ctx, ...param) => (e2) => keys.ctrl(e2) && param.every((p2) => keys[p2] ? keys[p2](e2) : e2.key === p2),
  shift: (ctx, ...param) => (e2) => keys.shift(e2) && param.every((p2) => keys[p2] ? keys[p2](e2) : e2.key === p2),
  alt: (ctx, ...param) => (e2) => keys.alt(e2) && param.every((p2) => keys[p2] ? keys[p2](e2) : e2.key === p2),
  meta: (ctx, ...param) => (e2) => keys.meta(e2) && param.every((p2) => keys[p2] ? keys[p2](e2) : e2.key === p2),
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
    el.setAttribute(
      name,
      v2 === true ? "" : typeof v2 === "number" || typeof v2 === "string" ? v2 : ""
    );
};
var evaluatorMemo = {};
function parseExpr(el, expression, dir) {
  let evaluate = evaluatorMemo[expression];
  if (!evaluate) {
    try {
      evaluate = evaluatorMemo[expression] = compile_default2(expression);
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
  console.warn(
    `\u2234 ${error.message}

${directive}=${expression ? `"${expression}"

` : ""}`,
    element
  );
  throw error;
}
function dashcase(str) {
  return str.replace(
    /[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g,
    (match) => "-" + match.toLowerCase()
  );
}

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
function p(i2) {
  return new _(i2);
}
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

// src/core.js
var _dispose = Symbol.dispose ||= Symbol("dispose");
var memo = /* @__PURE__ */ new WeakMap();
function sprae(container, values) {
  if (!container.children)
    return;
  const state = values || {};
  const disposes = [];
  const init = (el, parent = el.parentNode) => {
    for (let name in primary) {
      let attrName = ":" + name;
      if (el.hasAttribute?.(attrName)) {
        let expr2 = el.getAttribute(attrName);
        el.removeAttribute(attrName);
        disposes.push(primary[name](el, expr2, state, name));
        if (memo.has(el))
          return;
        if (el.parentNode !== parent)
          return false;
      }
    }
    if (el.attributes) {
      for (let i2 = 0; i2 < el.attributes.length; ) {
        let attr2 = el.attributes[i2], prefix = attr2.name[0];
        if (prefix === ":") {
          el.removeAttribute(attr2.name);
          let expr2 = attr2.value, names = attr2.name.slice(1).split(prefix);
          for (let name of names) {
            let dir = secondary[name] || directives_default;
            disposes.push(dir(el, expr2, state, name));
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
  if (memo.has(container))
    return state;
  memo.set(container, state);
  if (disposes.length)
    Object.defineProperty(container, _dispose, {
      value: () => {
        while (disposes.length)
          disposes.shift()?.();
        memo.delete(container);
      }
    });
  return state;
}

// src/index.js
var src_default = sprae;
if (document.currentScript)
  sprae(document.documentElement);
export {
  d as Signal,
  _dispose,
  n as batch,
  p as computed,
  src_default as default,
  O as effect,
  a as signal,
  s as untracked
};
