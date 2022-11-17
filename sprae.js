// node_modules/sube/sube.js
Symbol.observable ||= Symbol("observable");
var observable = (arg) => arg && !!(arg[Symbol.observable] || arg[Symbol.asyncIterator] || arg.call && arg.set || arg.subscribe || arg.then);
var registry = new FinalizationRegistry((unsub) => unsub.call?.());
var unsubr = (sub) => sub && (() => sub.unsubscribe?.());
var sube_default = (target, next, error, complete, stop, unsub) => target && (unsub = unsubr((target[Symbol.observable]?.() || target).subscribe?.(next, error, complete)) || target.set && target.call?.(stop, next) || (target.then?.((v) => (!stop && next(v), complete?.()), error) || (async (v) => {
  try {
    for await (v of target) {
      if (stop)
        return;
      next(v);
    }
    complete?.();
  } catch (err) {
    error?.(err);
  }
})()) && ((_) => stop = 1), registry.register(target, unsub), unsub);

// src/core.js
var curEl;
var curDir;
function sprae(el2, initScope) {
  initScope ||= {};
  let updates = [], ready = false;
  const update = (values2) => {
    updates.forEach((update2) => update2(values2));
  };
  const rsube = (scope) => {
    let values2 = {};
    for (let k in scope) {
      let v = scope[k];
      if (observable(v = scope[k]))
        values2[k] = null, registry2.register(v, sube_default(v, (v2) => (values2[k] = v2, ready && update(values2))));
      else if (v?.constructor === Object)
        values2[k] = rsube(v);
      else
        values2[k] = v;
    }
    return values2;
  };
  const values = rsube(initScope);
  ready = true;
  for (let name in directives) {
    const sel = `[${name.replace(":", "\\:")}]`, initDirective = directives[name];
    const els = [...el2.querySelectorAll(sel)];
    if (el2.matches?.(sel))
      els.unshift(el2);
    let update2;
    for (let el3 of els)
      if (update2 = initDirective(el3, values))
        updates.push(update2);
  }
  ;
  update(values);
  values[Symbol.iterator] = function* () {
    yield proxy;
    yield (diff) => update(Object.assign(values, diff));
  };
  const proxy = new Proxy(values, {
    set: (s, k, v) => (values[k] = v, update(values), 1),
    deleteProperty: (s, k) => (values[k] = void 0, update(values), 1)
  });
  return proxy;
}
var directives = {};
var directive = (name, initializer) => {
  const className = name.replace(":", "\u2234");
  return directives[name] = (el2, initValues) => {
    if (el2.classList.contains(className))
      return;
    el2.classList.add(className);
    let expr = el2.getAttribute(name);
    el2.removeAttribute(name);
    return initializer(el2, expr, initValues);
  };
};
var registry2 = new FinalizationRegistry((unsub) => unsub?.call?.());
var evaluatorMemo = {};
function parseExpr(expression) {
  if (evaluatorMemo[expression])
    return evaluatorMemo[expression];
  let rightSideSafeExpression = /^[\n\s]*if.*\(.*\)/.test(expression) || /^(let|const)\s/.test(expression) ? `(() => { ${expression} })()` : expression;
  const safeFunction = () => {
    try {
      return new Function(["scope"], `let result; with (scope) { result = ${rightSideSafeExpression} }; return result;`);
    } catch (e) {
      return exprError(e, expression);
    }
  };
  return evaluatorMemo[expression] = safeFunction();
}
function exprError(error, expression) {
  Object.assign(error, { expression });
  console.warn(`\u2234 ${error.message}

${curDir}=${expression ? `"${expression}"

` : ""}`, curEl);
  setTimeout(() => {
    throw error;
  }, 0);
  return Promise.resolve();
}

// src/directives/with.js
directive(":with", (el2, expr, rootValues) => {
  let evaluate = parseExpr(expr);
  let subscope = Object.create(rootValues);
  Object.assign(subscope, evaluate(rootValues));
  let [subvalues, subupdate] = sprae(el2, subscope);
  return (values) => {
    let withValues = evaluate(values);
    subupdate(withValues);
  };
});

// src/directives/each.js
directive(":each", (el2, expr) => {
  let each = parseForExpression(expr);
  if (!each)
    return exprError(new Error(), expr);
  const getItems = parseExpr(each.items);
  const holder = new Text();
  el2.replaceWith(holder);
  let els = [];
  return (state) => {
    els.forEach((el3) => el3.remove());
    els = [];
    let items = getItems(state);
    if (typeof items === "number")
      items = Array.from({ length: items }, (item, i) => i + 1);
    items?.forEach((item, i) => {
      const scope = { ...state };
      scope[each.item] = item;
      if (each.index)
        scope[each.index] = i;
      let itemEl = el2.cloneNode(true);
      els.push(itemEl);
      holder.before(itemEl);
      sprae(itemEl, scope);
    });
  };
});
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

// src/directives/text.js
directive(":text", (el2, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    el2.textContent = value == null ? "" : value;
  };
});

// src/directives/if.js
directive(":if", (el2, expr) => {
  let cur = el2, els = [el2], clauses = [parseExpr(expr)], holder = new Text();
  while (cur = el2.nextElementSibling) {
    if (expr = cur.getAttribute(":else-if")) {
      cur.removeAttribute(":else-if");
      cur.classList.add("\u2234else-if");
      cur.remove();
      els.push(cur);
      clauses.push(parseExpr(expr));
      continue;
    }
    if (cur.hasAttribute(":else")) {
      cur.removeAttribute(":else");
      cur.classList.add("\u2234else");
      cur.remove();
      els.push(cur);
      clauses.push(() => 1);
    }
    break;
  }
  cur = els[0];
  return (state) => {
    let idx = clauses.findIndex((match) => match(state));
    if (idx >= 0)
      cur.replaceWith(cur = els[idx]);
    else
      cur.replaceWith(cur = holder);
  };
});

// node_modules/element-props/element-props.js
var prop = (el2, k, v) => {
  if (k.startsWith("on"))
    k = k.toLowerCase();
  if (el2[k] !== v) {
    el2[k] = v;
  }
  if (v === false || v == null)
    el2.removeAttribute(k);
  else if (typeof v !== "function")
    el2.setAttribute(
      dashcase(k),
      v === true ? "" : typeof v === "number" || typeof v === "string" ? v : k === "class" ? (Array.isArray(v) ? v : Object.entries(v).map(([k2, v2]) => v2 ? k2 : "")).filter(Boolean).join(" ") : k === "style" ? Object.entries(v).map(([k2, v2]) => `${k2}: ${v2}`).join(";") : ""
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

// src/directives/common.js
common(`id`), common(`name`), common(`for`), common(`type`), common(`hidden`), common(`disabled`), common(`href`), common(`src`), common(`style`), common(`class`);
function common(name) {
  directive(":" + name, (el2, expr) => {
    let evaluate = parseExpr(expr);
    return (state) => {
      let value = evaluate(state);
      prop(el2, name, value);
    };
  });
}

// src/directives/prop.js
directive(":prop", (el2, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    for (let key in value)
      prop(el2, key, value[key]);
  };
});

// src/directives/data.js
directive(":data", (el2, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    for (let key in value)
      el2.dataset[key] = value[key];
  };
});

// src/directives/aria.js
directive(":aria", (el2, expr) => {
  let evaluate = parseExpr(expr);
  return (state) => {
    let value = evaluate(state);
    for (let key in value)
      prop(el2, "aria" + key[0].toUpperCase() + key.slice(1), value[key]);
  };
});

// src/directives/value.js
directive(":value", (el2, expr) => {
  let evaluateGet = parseExpr(expr);
  let [get, set] = input(el2);
  let evaluateSet = parseSetter(expr);
  let curState, onchange = (e) => evaluateSet(curState, get(el2));
  el2.addEventListener("input", onchange);
  el2.addEventListener("change", onchange);
  return (state) => {
    let value = evaluateGet(curState = state);
    prop(el2, "value", value);
    set(value);
  };
});
var memo = {};
function parseSetter(expr) {
  if (memo[expr])
    return memo[expr];
  return memo[expr] = new Function(
    ["scope", "value"],
    `with (scope) { ${expr} = value };`
  );
}

// src/directives/on.js
directive(":on", (el2, expr) => {
  let evaluate = parseExpr(expr);
  let listeners = {};
  return (state) => {
    for (let evt in listeners)
      el2.removeEventListener(evt, listeners[evt]);
    listeners = evaluate(state);
    for (let evt in listeners)
      el2.addEventListener(evt, listeners[evt]);
  };
});

// src/index.js
var src_default = sprae;
export {
  src_default as default,
  directive,
  exprError,
  parseExpr
};
