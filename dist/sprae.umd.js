(function (g, f) {if ("object" == typeof exports && "object" == typeof module) {module.exports = f();} else if ("function" == typeof define && define.amd) {define("sprae", [], f);} else if ("object" == typeof exports) {exports["sprae"] = f();} else {g["sprae"] = f();}}(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this, () => {var exports = {};var module = { exports };
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// package.json
var package_default;
var init_package = __esm({
  "package.json"() {
    package_default = {
      name: "sprae",
      description: "DOM microhydration",
      version: "12.2.1",
      main: "./sprae.js",
      module: "./sprae.js",
      "umd:main": "dist/sprae.umd.js",
      unpkg: "dist/sprae.umd.js",
      types: "dist/sprae.d.ts",
      type: "module",
      files: [
        "core.js",
        "sprae.js",
        "store.js",
        "signal.js",
        "micro.js",
        "directive",
        "dist"
      ],
      devDependencies: {
        "@preact/signals": "^2.0.4",
        "@preact/signals-core": "^1.8.0",
        "@webreflection/signal": "^2.1.2",
        "es-module-shims": "^1.10.0",
        esbuild: "^0.23.0",
        "esbuild-plugin-umd-wrapper": "^2.0.3",
        hyperf: "^1.7.0",
        jsdom: "^27.0.0",
        requestidlecallback: "^0.3.0",
        "signal-polyfill": "^0.1.1",
        subscript: "^9.1.0",
        tst: "^7.2.0",
        ulive: "^1.0.7",
        usignal: "^0.9.0",
        "wait-please": "^3.1.0"
      },
      scripts: {
        test: "node -r ./test/register.cjs test/test.js",
        build: "node .esbuild.js"
      },
      repository: {
        type: "git",
        url: "git+https://github.com/dy/sprae.git"
      },
      keywords: [
        "hydration",
        "progressive",
        "progressive enhancement",
        "signals",
        "directives",
        "preact-signals",
        "reactive",
        "template-parts",
        "petit-vue",
        "alpinejs",
        "templating"
      ],
      author: "Dmitry Iv <df.creative@gmail.com>",
      license: "MIT",
      bugs: {
        url: "https://github.com/dy/sprae/issues"
      },
      homepage: "https://github.com/dy/sprae#readme"
    };
  }
});

// core.js
var _dispose, _state, _on, _off, _add, prefix, signal, effect, computed, batch, untracked, directive, modifier, currentDir, sprae, initDirective, use, start, compile, parse, applyMods, sx, frag, call, dashcase, attr, clsx, throttle, debounce, core_default;
var init_core = __esm({
  "core.js"() {
    init_store();
    init_package();
    init_store();
    _dispose = Symbol.dispose || (Symbol.dispose = Symbol("dispose"));
    _state = Symbol("state");
    _on = Symbol("on");
    _off = Symbol("off");
    _add = Symbol("init");
    prefix = ":";
    batch = (fn) => fn();
    untracked = batch;
    directive = {};
    modifier = {};
    currentDir = null;
    sprae = (el = document.body, state) => {
      if (el[_state]) return Object.assign(el[_state], state);
      state = store_default(state || {});
      let fx = [], offs = [];
      el[_on] = () => !offs && (offs = fx.map((fn) => fn()));
      el[_off] = () => (offs?.map((off) => off()), offs = null);
      el[_dispose] || (el[_dispose] = () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_add] = el[_state] = null));
      const add = el[_add] = (el2) => {
        let _attrs = el2.attributes, fn;
        if (_attrs) for (let i = 0; i < _attrs.length; ) {
          let { name, value } = _attrs[i];
          if (name.startsWith(prefix)) {
            el2.removeAttribute(name);
            if (fn = initDirective(el2, name, value, state)) fx.push(fn), offs.push(fn());
            if (_state in el2) return;
          } else i++;
        }
        for (let child of [...el2.childNodes]) child.nodeType == 1 && add(child);
      };
      add(el);
      if (el[_state] === void 0) el[_state] = state;
      return state;
    };
    sprae.version = package_default.version;
    initDirective = (el, dirName, expr, state) => {
      let cur2, off;
      let steps = dirName.slice(prefix.length).split("..").map((step, i, { length }) => (
        // multiple attributes like :id:for=""
        step.split(prefix).reduce((prev, str) => {
          let [name, ...mods] = str.split(".");
          let evaluate = parse(expr, directive[currentDir = name]?.parse);
          if (name.startsWith("on")) {
            let type = name.slice(2), fn2 = applyMods(
              sx(
                // single event vs chain
                length == 1 ? (e) => evaluate(state, (fn3) => call(fn3, e)) : (e) => (cur2 = (!i ? (e2) => call(evaluate(state), e2) : cur2)(e), off(), off = steps[(i + 1) % length]()),
                { target: el }
              ),
              mods
            );
            return (_poff) => (_poff = prev?.(), fn2.target.addEventListener(type, fn2, fn2), () => (_poff?.(), fn2.target.removeEventListener(type, fn2)));
          }
          let fn, dispose, change, count;
          if (mods.length) {
            change = signal(-1), // signal authorized to trigger effect: 0 = init; >0 = trigger
            count = -1;
            fn = applyMods(sx(throttle(() => {
              if (++change.value) return;
              dispose = effect(() => update && (change.value == count ? fn() : (
                // plan update: separate tick (via throttle) makes sure planner effect call is finished before eval call
                (count = change.value, evaluate(state, update))
              )));
            }), { target: el }), mods);
          } else {
            fn = sx(() => dispose = effect(() => evaluate(state, update)), { target: el });
          }
          let update = (directive[name] || directive["*"])(fn.target, state, expr, name);
          if (!update) return;
          if (el[_state]) state = el[_state];
          return (_poff) => (_poff = prev?.(), // console.log('ON', name),
          fn(), () => (
            // console.log('OFF', name, el),
            (_poff?.(), dispose?.(), change && (change.value = -1, count = dispose = null))
          ));
        }, null)
      ));
      return () => off = steps[0]?.();
    };
    use = (s) => (s.compile && (compile = s.compile), s.prefix && (prefix = s.prefix), s.signal && (signal = s.signal), s.effect && (effect = s.effect), s.computed && (computed = s.computed), s.batch && (batch = s.batch), s.untracked && (untracked = s.untracked));
    start = (root = document.body, values) => {
      const state = store_default(values);
      sprae(root, state);
      const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const el of m.addedNodes) {
            if (el.nodeType === 1 && el[_state] === void 0 && root.contains(el)) {
              root[_add](el);
            }
          }
        }
      });
      mo.observe(root, { childList: true, subtree: true });
      return state;
    };
    parse = (expr, prepare, _fn) => {
      if (_fn = parse.cache[expr]) return _fn;
      let _expr = expr.trim() || "undefined";
      if (prepare) _expr = prepare(_expr);
      if (/^(if|let|const)\b/.test(_expr) || /;(?![^{]*})/.test(_expr)) ;
      else _expr = `return ${_expr}`;
      if (/\bawait\s/.test(_expr)) _expr = `return (async()=>{ ${_expr} })()`;
      try {
        _fn = compile(_expr);
        Object.defineProperty(_fn, "name", { value: `\u2234 ${expr}` });
      } catch (e) {
        console.error(`\u2234 ${e}

${prefix + currentDir}="${expr}"`);
      }
      return parse.cache[expr] = (state, cb, _out) => {
        try {
          let result = _fn?.(state);
          if (cb) return result?.then ? result.then((v) => _out = cb(v)) : _out = cb(result), () => call(_out);
          else return result;
        } catch (e) {
          console.error(`\u2234 ${e}

${prefix + currentDir}="${expr}"`);
        }
      };
    };
    parse.cache = {};
    applyMods = (fn, mods) => {
      while (mods.length) {
        let [name, ...params] = mods.pop().split("-");
        fn = sx(modifier[name]?.(fn, ...params) ?? fn, fn);
      }
      return fn;
    };
    sx = (a, b) => {
      if (a != b) for (let k in b) a[k] ?? (a[k] = b[k]);
      return a;
    };
    frag = (tpl) => {
      if (!tpl.nodeType) return tpl;
      let content = tpl.content.cloneNode(true), attributes = [...tpl.attributes], ref = document.createTextNode(""), childNodes = (content.append(ref), [...content.childNodes]);
      return {
        // get parentNode() { return childNodes[0].parentNode },
        childNodes,
        content,
        remove: () => content.append(...childNodes),
        replaceWith(el) {
          if (el === ref) return;
          ref.before(el);
          content.append(...childNodes);
        },
        attributes,
        removeAttribute(name) {
          attributes.splice(attributes.findIndex((a) => a.name === name), 1);
        }
        // setAttributeNode() { }
      };
    };
    call = (v, arg) => typeof v === "function" ? v(arg) : v;
    dashcase = (str) => str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? "-" : "") + match.toLowerCase());
    attr = (el, name, v) => v == null || v === false ? el.removeAttribute(name) : el.setAttribute(name, v === true ? "" : v);
    clsx = (c, _out = []) => !c ? "" : typeof c === "string" ? c : (Array.isArray(c) ? c.map(clsx) : Object.entries(c).reduce((s, [k, v]) => !v ? s : [...s, k], [])).join(" ");
    throttle = (fn, schedule = queueMicrotask) => {
      let _planned = 0;
      const throttled = (e) => {
        if (!_planned++) fn(e), schedule((_dirty = _planned > 1) => (_planned = 0, _dirty && throttled(e)));
      };
      return throttled;
    };
    debounce = (fn, schedule = queueMicrotask, _count = 0) => (arg, _planned = ++_count) => schedule(() => _planned == _count && fn(arg));
    core_default = sprae;
  }
});

// store.js
var _signals, _change, _set, sandbox, store, list, create, set, store_default;
var init_store = __esm({
  "store.js"() {
    init_core();
    _signals = Symbol("signals");
    _change = Symbol("change");
    _set = Symbol("set");
    sandbox = true;
    store = (values, parent) => {
      if (!values) return values;
      if (values[Symbol.toStringTag]) return values;
      if (values[_signals]) return values;
      if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values;
      let keyCount = Object.keys(values).length, signals = {};
      let state = new Proxy(Object.assign(signals, {
        [_change]: signal(keyCount),
        [_signals]: signals
      }), {
        get: (_, k) => {
          if (k in signals) return signals[k] ? signals[k].valueOf() : signals[k];
          return parent ? parent[k] : globalThis[k];
        },
        set: (_, k, v, _s) => {
          if (k in signals) return set(signals, k, v), 1;
          sandbox = false;
          if (parent && k in parent) {
            parent[k] = v;
          } else {
            create(signals, k, v);
            signals[_change].value = ++keyCount;
          }
          sandbox = true;
          return 1;
        },
        // FIXME: try to avild calling Symbol.dispose here. Maybe _delete method?
        deleteProperty: (_, k) => {
          k in signals && (k[0] != "_" && signals[k]?.[Symbol.dispose]?.(), delete signals[k], signals[_change].value = --keyCount);
          return 1;
        },
        // subscribe to length when spreading
        ownKeys: () => (signals[_change].value, Reflect.ownKeys(signals)),
        // sandbox prevents writing to global
        has: (_, k) => {
          if (k in signals) return true;
          if (parent) return k in parent;
          return sandbox;
        }
      });
      const descs = Object.getOwnPropertyDescriptors(values);
      for (let k in values) {
        if (descs[k]?.get)
          (signals[k] = computed(descs[k].get.bind(state)))[_set] = descs[k].set?.bind(state);
        else create(signals, k, values[k]);
      }
      return state;
    };
    list = (values, parent = globalThis) => {
      let signals = Array(values.length).fill(null), isMut = false, mut = (fn) => function() {
        isMut = true;
        return fn.apply(this, arguments);
      }, length = signal(values.length), state = new Proxy(
        Object.assign(signals, {
          [_change]: length,
          [_signals]: signals,
          // patch mutators
          push: mut(signals.push),
          pop: mut(signals.pop),
          shift: mut(signals.shift),
          unshift: mut(signals.unshift),
          splice: mut(signals.splice)
        }),
        {
          get(_, k) {
            if (k === "length") return isMut ? (isMut = false, signals.length) : length.value;
            if (typeof k === "symbol" || isNaN(k)) return signals[k]?.valueOf() ?? parent[k];
            return (signals[k] ?? (signals[k] = signal(store(values[k])))).valueOf();
          },
          set(_, k, v) {
            if (k === "length") {
              for (let i = v; i < signals.length; i++) delete state[i];
              length.value = signals.length = v;
            } else if (k >= signals.length) create(signals, k, v), state.length = +k + 1;
            else signals[k] ? set(signals, k, v) : create(signals, k, v);
            return 1;
          },
          // dispose notifies any signal deps, like :each
          deleteProperty: (_, k) => (signals[k]?.[Symbol.dispose]?.(), delete signals[k], 1)
        }
      );
      return state;
    };
    create = (signals, k, v) => signals[k] = k[0] == "_" || v?.peek ? v : signal(store(v));
    set = (signals, k, v, _s, _v) => {
      return k[0] === "_" ? signals[k] = v : v !== (_v = (_s = signals[k]).peek()) && // stashed _set for value with getter/setter
      (_s[_set] ? _s[_set](v) : (
        // patch array
        Array.isArray(v) && Array.isArray(_v) ? (
          // if we update plain array (stored in signal) - take over value instead
          // since input value can be store, we have to make sure we don't subscribe to its length or values
          // FIXME: generalize to objects
          _change in _v ? untracked(() => batch(() => {
            for (let i = 0; i < v.length; i++) _v[i] = v[i];
            _v.length = v.length;
          })) : _s.value = v
        ) : (
          // .x = y
          _s.value = store(v)
        )
      ));
    };
    store_default = store;
  }
});

// signal.js
var current, depth, batched, signal2, effect2, computed2, batch2, untracked2;
var init_signal = __esm({
  "signal.js"() {
    depth = 0;
    signal2 = (v, _s, _obs = /* @__PURE__ */ new Set(), _v = () => _s.value) => _s = {
      get value() {
        current?.deps.push(_obs.add(current));
        return v;
      },
      set value(val) {
        if (val === v) return;
        v = val;
        for (let sub of _obs) batched ? batched.add(sub) : sub();
      },
      peek() {
        return v;
      },
      toJSON: _v,
      then: _v,
      toString: _v,
      valueOf: _v
    };
    effect2 = (fn, _teardown, _fx, _deps, __tmp) => (_fx = (prev) => {
      __tmp = _teardown;
      _teardown = null;
      __tmp?.call?.();
      prev = current, current = _fx;
      if (depth++ > 10) throw "Cycle detected";
      try {
        _teardown = fn();
      } finally {
        current = prev;
        depth--;
      }
    }, _deps = _fx.deps = [], _fx(), (dep) => {
      _teardown?.call?.();
      while (dep = _deps.pop()) dep.delete(_fx);
    });
    computed2 = (fn, _s = signal2(), _c, _e, _v = () => _c.value) => _c = {
      get value() {
        _e || (_e = effect2(() => _s.value = fn()));
        return _s.value;
      },
      peek: _s.peek,
      toJSON: _v,
      then: _v,
      toString: _v,
      valueOf: _v
    };
    batch2 = (fn, _first = !batched) => {
      batched ?? (batched = /* @__PURE__ */ new Set());
      try {
        fn();
      } finally {
        if (_first) {
          for (const fx of batched) fx();
          batched = null;
        }
      }
    };
    untracked2 = (fn, _prev, _v) => (_prev = current, current = null, _v = fn(), current = _prev, _v);
  }
});

// directive/if.js
var if_default;
var init_if = __esm({
  "directive/if.js"() {
    init_core();
    if_default = (el, state, _holder, _el, _match) => {
      var _a;
      if (!el._holder) {
        el[_a = _state] ?? (el[_a] = null);
        _el = el.content ? frag(el) : el;
        el.replaceWith(_holder = document.createTextNode(""));
        _el._holder = _holder._holder = _holder;
        _holder._clauses = [_el._clause = [_el, false]];
        _holder.update = throttle(() => {
          let match = _holder._clauses.find(([, s]) => s);
          if (match != _match) {
            _match?.[0].remove();
            _match?.[0][_off]?.();
            if (_match = match) {
              _holder.before(_match[0].content || _match[0]);
              !_match[0][_state] ? (delete _match[0][_state], core_default(_match[0], state)) : _match[0][_on]?.();
            }
          }
        });
      } else core_default(_el = el, state);
      return (value) => {
        _el._clause[1] = value;
        _el._holder.update();
      };
    };
  }
});

// directive/else.js
var else_default;
var init_else = __esm({
  "directive/else.js"() {
    init_core();
    else_default = (el, state, _el, _, _prev = el) => {
      _el = el.content ? frag(el) : el;
      while (_prev && !(_el._holder = _prev._holder)) _prev = _prev.previousSibling;
      el.remove();
      el[_state] = null;
      _el._holder._clauses.push(_el._clause = [_el, true]);
      return _el._holder.update;
    };
  }
});

// directive/text.js
var text_default;
var init_text = __esm({
  "directive/text.js"() {
    init_core();
    text_default = (el) => (
      // <template :text="a"/> or previously initialized template
      (el.content && el.replaceWith(el = frag(el).childNodes[0]), (v) => (v = call(v, el.textContent), el.textContent = v == null ? "" : v))
    );
  }
});

// directive/class.js
var class_default;
var init_class = __esm({
  "directive/class.js"() {
    init_core();
    class_default = (el, _cur, _new) => (_cur = /* @__PURE__ */ new Set(), (v) => {
      _new = /* @__PURE__ */ new Set();
      if (v) clsx(call(v, el.className)).split(" ").map((c) => c && _new.add(c));
      for (let c of _cur) if (_new.has(c)) _new.delete(c);
      else el.classList.remove(c);
      for (let c of _cur = _new) el.classList.add(c);
    });
  }
});

// directive/style.js
var style_default;
var init_style = __esm({
  "directive/style.js"() {
    init_core();
    style_default = (el, _static) => (_static = el.getAttribute("style"), (v) => {
      v = call(v, el.style);
      if (typeof v === "string") attr(el, "style", _static + "; " + v);
      else {
        if (_static) attr(el, "style", _static);
        for (let k in v) k[0] == "-" ? el.style.setProperty(k, v[k]) : k[0] > "A" && (el.style[k] = v[k]);
      }
    });
  }
});

// directive/fx.js
var fx_default;
var init_fx = __esm({
  "directive/fx.js"() {
    init_core();
    fx_default = () => call;
  }
});

// directive/value.js
var setter, value_default;
var init_value = __esm({
  "directive/value.js"() {
    init_core();
    setter = (expr, _set2 = parse(`${expr}=__`)) => (target, value) => {
      target.__ = value;
      _set2(target), delete target.__;
    };
    value_default = (el, state, expr, name) => {
      try {
        const set2 = setter(expr);
        const handleChange = el.type === "checkbox" ? () => set2(state, el.checked) : el.type === "select-multiple" ? () => set2(state, [...el.selectedOptions].map((o) => o.value)) : () => set2(state, el.selectedIndex < 0 ? null : el.value);
        el.oninput = el.onchange = handleChange;
        if (el.type?.startsWith("select")) {
          new MutationObserver(handleChange).observe(el, { childList: true, subtree: true, attributes: true });
          core_default(el, state);
        }
        parse(expr)(state) ?? handleChange();
      } catch {
      }
      return el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value, from, to) => (
        // we retain selection in input
        (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to))
      ) : el.type === "checkbox" ? (value) => (el.checked = value, attr(el, "checked", value)) : el.type === "radio" ? (value) => el.value === value && (el.checked = value, attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
        for (let o of el.options)
          o.value == value ? o.setAttribute("selected", "") : o.removeAttribute("selected");
        el.value = value;
      } : el.type === "select-multiple" ? (value) => {
        for (let o of el.options) o.removeAttribute("selected");
        for (let v of value) el.querySelector(`[value="${v}"]`).setAttribute("selected", "");
      } : (value) => el.value = value;
    };
  }
});

// directive/ref.js
var ref_default;
var init_ref = __esm({
  "directive/ref.js"() {
    init_core();
    ref_default = (el, state, expr, name, _prev, _set2) => {
      if (typeof parse(expr)(state) == "function") return (v) => v(el);
      Object.defineProperty(state, expr, { value: el, configurable: true });
    };
  }
});

// directive/scope.js
var scope_default;
var init_scope = __esm({
  "directive/scope.js"() {
    init_core();
    scope_default = (el, rootState) => {
      let subscope = el[_state] = store({}, rootState), init = false;
      return (values) => {
        values = call(values, subscope);
        if (values !== subscope) {
          for (let k in values) {
            let v = typeof values[k] === "function" ? values[k].bind(subscope) : values[k];
            if (k in subscope[_signals]) subscope[k] = v;
            else subscope[_signals][k] = k[0] == "_" || v?.peek ? v : signal(store(v));
          }
        }
        return !init && (init = true, delete el[_state], untracked(() => core_default(el, subscope)));
      };
    };
  }
});

// directive/each.js
var each, each_default;
var init_each = __esm({
  "directive/each.js"() {
    init_core();
    each = (tpl, state, expr) => {
      let [itemVar, idxVar = "$"] = expr.split(/\bin\b/)[0].trim().replace(/\(|\)/g, "").split(/\s*,\s*/);
      let holder = document.createTextNode("");
      let cur2, keys2, items, prevl = 0;
      let update = throttle(() => {
        var _a, _b;
        let i = 0, newItems = items, newl = newItems.length;
        if (cur2 && !cur2[_change]) {
          for (let s of cur2[_signals] || []) s[Symbol.dispose]();
          cur2 = null, prevl = 0;
        }
        if (newl < prevl) cur2.length = newl;
        else {
          if (!cur2) cur2 = newItems;
          else while (i < prevl) cur2[i] = newItems[i++];
          for (; i < newl; i++) {
            cur2[i] = newItems[i];
            let idx = i, subscope = Object.create(state, {
              [itemVar]: { get: () => cur2[idx] },
              [idxVar]: { value: keys2 ? keys2[idx] : idx }
            });
            let el = tpl.content ? frag(tpl) : tpl.cloneNode(true);
            holder.before(el.content || el);
            core_default(el, subscope);
            let _prev = ((_b = cur2[_a = _signals] || (cur2[_a] = []))[i] || (_b[i] = {}))[Symbol.dispose];
            cur2[_signals][i][Symbol.dispose] = () => {
              _prev?.(), el[Symbol.dispose]?.(), el.remove();
            };
          }
        }
        prevl = newl;
      });
      tpl.replaceWith(holder);
      tpl[_state] = null;
      return (value) => {
        keys2 = null;
        if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1);
        else if (value?.constructor === Object) keys2 = Object.keys(value), items = Object.values(value);
        else items = value || [];
        return effect(() => {
          items[_change]?.value;
          update();
        });
      };
    };
    each.parse = (str) => str.split(/\bin\b/)[1].trim();
    each_default = each;
  }
});

// directive/default.js
var default_default;
var init_default = __esm({
  "directive/default.js"() {
    init_core();
    default_default = (el, st, ex, name) => (v) => attr(el, name, call(v, el.getAttribute(name)));
  }
});

// directive/spread.js
var spread_default;
var init_spread = __esm({
  "directive/spread.js"() {
    init_core();
    spread_default = (target) => (value) => {
      for (let key in value) attr(target, dashcase(key), value[key]);
    };
  }
});

// sprae.js
var sprae_exports = {};
__export(sprae_exports, {
  batch: () => batch2,
  computed: () => computed2,
  default: () => sprae_default,
  effect: () => effect2,
  signal: () => signal2,
  sprae: () => core_default,
  start: () => start,
  store: () => store_default,
  untracked: () => untracked2,
  use: () => use
});
var keys, sprae_default;
var init_sprae = __esm({
  "sprae.js"() {
    init_store();
    init_signal();
    init_core();
    init_if();
    init_else();
    init_text();
    init_class();
    init_style();
    init_fx();
    init_value();
    init_ref();
    init_scope();
    init_each();
    init_default();
    init_spread();
    Object.assign(directive, {
      // :x="x"
      "*": default_default,
      // FIXME
      // 'on*': _on,
      // :="{a,b,c}"
      "": spread_default,
      // :class="[a, b, c]"
      class: class_default,
      // :text="..."
      text: text_default,
      // :style="..."
      style: style_default,
      // :fx="..."
      fx: fx_default,
      // :value - 2 way binding like x-model
      value: value_default,
      // :ref="..."
      ref: ref_default,
      // :scope creates variables scope for a subtree
      scope: scope_default,
      if: if_default,
      else: else_default,
      // :each="v,k in src"
      each: each_default
    });
    Object.assign(modifier, {
      debounce: (fn, _how = 250, _schedule = _how === "tick" ? queueMicrotask : _how === "raf" ? requestAnimationFrame : _how === "idle" ? requestIdleCallback : (fn2) => setTimeout(fn2, _how), _count = 0) => debounce(fn, _schedule),
      throttle: (fn, _how = 250, _schedule = _how === "tick" ? queueMicrotask : _how === "raf" ? requestAnimationFrame : (fn2) => setTimeout(fn2, _how)) => throttle(fn, _schedule),
      once: (fn, _done, _fn) => Object.assign((e) => !_done && (_done = 1, fn(e)), { once: true }),
      // event modifiers
      // actions
      prevent: (fn) => (e) => (e?.preventDefault(), fn(e)),
      stop: (fn) => (e) => (e?.stopPropagation(), fn(e)),
      immediate: (fn) => (e) => (e?.stopImmediatePropagation(), fn(e)),
      // options
      passive: (fn) => (fn.passive = true, fn),
      capture: (fn) => (fn.capture = true, fn),
      // target
      window: (fn) => (fn.target = fn.target.ownerDocument.defaultView, fn),
      document: (fn) => (fn.target = fn.target.ownerDocument, fn),
      root: (fn) => (fn.target = fn.target.ownerDocument.documentElement, fn),
      body: (fn) => (fn.target = fn.target.ownerDocument.body, fn),
      parent: (fn) => (fn.target = fn.target.parentNode, fn),
      // testers
      self: (fn) => (e) => e.target === fn.target && fn(e),
      outside: (fn) => (e, _target) => (_target = fn.target, !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight))
    });
    keys = {
      ctrl: (e) => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
      shift: (e) => e.shiftKey || e.key === "Shift",
      alt: (e) => e.altKey || e.key === "Alt",
      meta: (e) => e.metaKey || e.key === "Meta" || e.key === "Command",
      arrow: (e) => e.key.startsWith("Arrow"),
      enter: (e) => e.key === "Enter",
      esc: (e) => e.key.startsWith("Esc"),
      tab: (e) => e.key === "Tab",
      space: (e) => e.key === "\xA0" || e.key === "Space" || e.key === " ",
      delete: (e) => e.key === "Delete" || e.key === "Backspace",
      digit: (e) => /^\d$/.test(e.key),
      letter: (e) => /^\p{L}$/gu.test(e.key),
      char: (e) => /^\S$/.test(e.key)
    };
    for (let k in keys) modifier[k] = (fn, ...params) => (e) => keys[k](e) && params.every((k2) => keys[k2]?.(e) ?? e.key === k2) && fn(e);
    use({
      compile: (expr) => {
        return core_default.constructor(`with (arguments[0]) { ${expr} }`);
      },
      // signals
      signal: signal2,
      effect: effect2,
      computed: computed2,
      batch: batch2,
      untracked: untracked2
    });
    core_default.use = use;
    core_default.store = store_default;
    core_default.directive = directive;
    core_default.modifier = modifier;
    core_default.start = start;
    sprae_default = core_default;
  }
});

// <stdin>
var sprae2 = (init_sprae(), __toCommonJS(sprae_exports)).default;
module.exports = sprae2;
var cur = document.currentScript;
var prefix2 = cur.getAttribute("prefix") ?? cur.dataset.prefix ?? cur.dataset.spraePrefix;
var start2 = cur.getAttribute("start") ?? cur.dataset.start ?? cur.dataset.spraeStart;
if (prefix2) sprae2.use({ prefix: prefix2 });
if (start2 != null && start2 !== "false") (start2 && start2 !== "true" ? document.querySelectorAll(start2) : [document.body || document.documentElement]).forEach((el) => sprae2.start(el));
;if (typeof module.exports == "object" && typeof exports == "object") {
  var __cp = (to, from, except, desc) => {
    if ((from && typeof from === "object") || typeof from === "function") {
      for (let key of Object.getOwnPropertyNames(from)) {
        if (!Object.prototype.hasOwnProperty.call(to, key) && key !== except)
        Object.defineProperty(to, key, {
          get: () => from[key],
          enumerable: !(desc = Object.getOwnPropertyDescriptor(from, key)) || desc.enumerable,
        });
      }
    }
    return to;
  };
  module.exports = __cp(module.exports, exports);
}
return module.exports;
}))
