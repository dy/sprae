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

// signal.js
var current, signal, effect, computed, batch, untracked, use;
var init_signal = __esm({
  "signal.js"() {
    signal = (v, s, obs = /* @__PURE__ */ new Set()) => (s = {
      get value() {
        current?.deps.push(obs.add(current));
        return v;
      },
      set value(val) {
        if (val === v) return;
        v = val;
        for (let sub of obs) sub();
      },
      peek() {
        return v;
      }
    }, s.toJSON = s.then = s.toString = s.valueOf = () => s.value, s);
    effect = (fn, teardown, fx, deps) => (fx = (prev) => {
      teardown?.call?.();
      prev = current, current = fx;
      try {
        teardown = fn();
      } finally {
        current = prev;
      }
    }, deps = fx.deps = [], fx(), (dep) => {
      teardown?.call?.();
      while (dep = deps.pop()) dep.delete(fx);
    });
    computed = (fn, s = signal(), c, e) => (c = {
      get value() {
        e || (e = effect(() => s.value = fn()));
        return s.value;
      },
      peek: s.peek
    }, c.toJSON = c.then = c.toString = c.valueOf = () => c.value, c);
    batch = (fn) => fn();
    untracked = batch;
    use = (s) => (signal = s.signal, effect = s.effect, computed = s.computed, batch = s.batch || batch, untracked = s.untracked || untracked);
  }
});

// store.js
var store_exports = {};
__export(store_exports, {
  _change: () => _change,
  _signals: () => _signals,
  _stash: () => _stash,
  default: () => store_default,
  list: () => list,
  setter: () => setter,
  store: () => store
});
var _signals, _change, _stash, store, list, mut, set, setter, store_default;
var init_store = __esm({
  "store.js"() {
    init_signal();
    init_core();
    _signals = Symbol("signals");
    _change = Symbol("change");
    _stash = "__";
    store = (values, parent) => {
      if (!values) return values;
      if (values[_signals] || values[Symbol.toStringTag]) return values;
      if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values;
      let signals = Object.create(parent?.[_signals] || {}), _len = signal(Object.keys(values).length), stash;
      let state = new Proxy(signals, {
        get: (_, k) => k === _change ? _len : k === _signals ? signals : k === _stash ? stash : k in signals ? signals[k]?.valueOf() : globalThis[k],
        set: (_, k, v, s) => k === _stash ? (stash = v, 1) : (s = k in signals, set(signals, k, v), s || ++_len.value),
        // bump length for new signal
        deleteProperty: (_, k) => (signals[k] && (signals[k][Symbol.dispose]?.(), delete signals[k], _len.value--), 1),
        // subscribe to length when object is spread
        ownKeys: () => (_len.value, Reflect.ownKeys(signals)),
        has: (_) => true
        // sandbox prevents writing to global
      }), descs = Object.getOwnPropertyDescriptors(values);
      for (let k in values) {
        if (descs[k]?.get)
          (signals[k] = computed(descs[k].get.bind(state)))._set = descs[k].set?.bind(state);
        else
          signals[k] = null, set(signals, k, values[k]);
      }
      return state;
    };
    list = (values) => {
      let lastProp, _len = signal(values.length), signals = Array(values.length).fill(), state = new Proxy(signals, {
        get(_, k) {
          if (typeof k === "symbol") return k === _change ? _len : k === _signals ? signals : signals[k];
          if (k === "length") return mut.includes(lastProp) ? _len.peek() : _len.value;
          lastProp = k;
          return (signals[k] ?? (signals[k] = signal(store(values[k])))).valueOf();
        },
        set(_, k, v) {
          if (k === "length") {
            for (let i = v; i < signals.length; i++) delete state[i];
            _len.value = signals.length = v;
          } else {
            set(signals, k, v);
            if (k >= _len.peek()) _len.value = signals.length = +k + 1;
          }
          return 1;
        },
        deleteProperty: (_, k) => (signals[k]?.[Symbol.dispose]?.(), delete signals[k], 1)
      });
      return state;
    };
    mut = ["push", "pop", "shift", "unshift", "splice"];
    set = (signals, k, v) => {
      let s = signals[k], cur;
      if (k[0] === "_") signals[k] = v;
      else if (!s) signals[k] = s = v?.peek ? v : signal(store(v));
      else if (v === (cur = s.peek())) ;
      else if (s._set) s._set(v);
      else if (Array.isArray(v) && Array.isArray(cur)) {
        if (cur[_change]) batch(() => {
          for (let i = 0; i < v.length; i++) cur[i] = v[i];
          cur.length = v.length;
        });
        else s.value = v;
      } else s.value = store(v);
    };
    setter = (expr, set2 = parse(`${expr}=${_stash}`)) => (state, value) => (state[_stash] = value, // save value to stash
    set2(state));
    store_default = store;
  }
});

// core.js
var _dispose, _state, _on, _off, directive, dir, sprae, parse, memo, err, compile, prefix, frag, core_default;
var init_core = __esm({
  "core.js"() {
    init_signal();
    init_store();
    _dispose = Symbol.dispose || (Symbol.dispose = Symbol("dispose"));
    _state = Symbol("state");
    _on = Symbol("on");
    _off = Symbol("off");
    directive = {};
    dir = (name, create, p = parse) => directive[name] = (el, expr, state, name2, update, evaluate) => (update = create(el, state, expr, name2), evaluate = p(expr), () => update(evaluate(state)));
    sprae = (el = document.body, values) => {
      if (el[_state]) return Object.assign(el[_state], values);
      let state = store(values || {}), offs = [], fx = [];
      let init = (el2, attrs = el2.attributes) => {
        if (attrs) for (let i = 0; i < attrs.length; ) {
          let { name, value } = attrs[i], update, dir2;
          if (name.startsWith(prefix)) {
            el2.removeAttribute(name);
            for (dir2 of name.slice(prefix.length).split(":")) {
              update = (directive[dir2] || directive.default)(el2, value, state, dir2);
              fx.push(update);
              offs.push(effect(update));
              if (el2[_state] === null) return;
            }
          } else i++;
        }
        for (let child of el2.childNodes) child.nodeType == 1 && init(child);
      };
      init(el);
      if (!(_state in el)) {
        el[_state] = state;
        el[_off] = () => (offs.map((off) => off()), offs = []);
        el[_on] = () => offs = fx.map((f) => effect(f));
        el[_dispose] = () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null);
      }
      return state;
    };
    sprae.use = (s) => (s.signal && use(s), s.compile && (compile = s.compile), s.prefix && (prefix = s.prefix));
    parse = (expr, dir2, fn) => {
      if (fn = memo[expr = expr.trim()]) return fn;
      try {
        fn = compile(expr);
      } catch (e) {
        err(e, dir2, expr);
      }
      return memo[expr] = (s) => {
        try {
          return fn(s);
        } catch (e) {
          err(e, dir2, expr);
        }
      };
    };
    memo = {};
    err = (e, dir2 = "", expr = "") => {
      throw Object.assign(e, { message: `\u2234 ${e.message}

${dir2}${expr ? `="${expr}"

` : ""}`, expr });
    };
    prefix = ":";
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
    core_default = sprae;
  }
});

// directive/if.js
var _prevIf;
var init_if = __esm({
  "directive/if.js"() {
    init_core();
    _prevIf = Symbol("if");
    dir("if", (el, state) => {
      let holder = document.createTextNode("");
      let nextEl = el.nextElementSibling, curEl, ifEl, elseEl;
      el.replaceWith(holder);
      ifEl = el.content ? frag(el) : el;
      ifEl[_state] = null;
      if (nextEl?.hasAttribute(":else")) {
        nextEl.removeAttribute(":else");
        if (!nextEl.hasAttribute(":if")) nextEl.remove(), elseEl = nextEl.content ? frag(nextEl) : nextEl, elseEl[_state] = null;
      }
      return (value, newEl = el[_prevIf] ? null : value ? ifEl : elseEl) => {
        if (nextEl) nextEl[_prevIf] = el[_prevIf] || newEl == ifEl;
        if (curEl != newEl) {
          if (curEl) curEl.remove(), curEl[_off]?.();
          if (curEl = newEl) {
            holder.before(curEl.content || curEl);
            curEl[_state] === null ? (delete curEl[_state], core_default(curEl, state)) : curEl[_on]();
          }
        }
      };
    });
  }
});

// directive/each.js
var init_each = __esm({
  "directive/each.js"() {
    init_core();
    init_store();
    init_signal();
    dir(
      "each",
      (tpl, state, expr) => {
        let [itemVar, idxVar = "$"] = expr.split(/\bin\b/)[0].trim().split(/\s*,\s*/);
        let holder = document.createTextNode("");
        let cur, keys2, items, prevl = 0;
        let update = () => {
          var _a, _b;
          let i = 0, newItems = items, newl = newItems.length;
          if (cur && !cur[_change]) {
            for (let s of cur[_signals] || []) s[Symbol.dispose]();
            cur = null, prevl = 0;
          }
          if (newl < prevl) cur.length = newl;
          else {
            if (!cur) cur = newItems;
            else while (i < prevl) cur[i] = newItems[i++];
            for (; i < newl; i++) {
              cur[i] = newItems[i];
              let idx = i, scope = store_default({
                [itemVar]: cur[_signals]?.[idx] || cur[idx],
                [idxVar]: keys2 ? keys2[idx] : idx
              }, state), el = tpl.content ? frag(tpl) : tpl.cloneNode(true);
              holder.before(el.content || el);
              core_default(el, scope);
              ((_b = cur[_a = _signals] || (cur[_a] = []))[i] || (_b[i] = {}))[Symbol.dispose] = () => {
                el[Symbol.dispose]?.(), el.remove();
              };
            }
          }
          prevl = newl;
        };
        tpl.replaceWith(holder);
        tpl[_state] = null;
        return (value) => {
          keys2 = null;
          if (typeof value === "number") items = Array.from({ length: value }, (_, i) => i + 1);
          else if (value?.constructor === Object) keys2 = Object.keys(value), items = Object.values(value);
          else items = value || [];
          let planned = 0;
          return effect(() => {
            items[_change]?.value;
            if (!planned++) update(), queueMicrotask(() => (planned > 1 && update(), planned = 0));
          });
        };
      },
      // redefine evaluator to take second part of expression
      (expr) => parse(expr.split(/\bin\b/)[1])
    );
  }
});

// directive/ref.js
var init_ref = __esm({
  "directive/ref.js"() {
    init_core();
    init_signal();
    init_store();
    dir("ref", (el, state, expr) => typeof parse(expr)(state) == "function" ? (v) => v.call(null, el) : (setter(expr)(state, el), (_) => _));
  }
});

// directive/with.js
var init_with = __esm({
  "directive/with.js"() {
    init_core();
    init_signal();
    init_store();
    dir("with", (el, rootState, state) => (state = null, (values) => !state ? (
      // NOTE: we force untracked because internal directives can eval outside of effects (like ref etc) that would cause unwanted subscribe
      // FIXME: since this can be async effect, we should create & sprae it in advance.
      untracked(() => core_default(el, state = store_default(values, rootState)))
    ) : core_default(el, values)));
  }
});

// directive/text.js
var init_text = __esm({
  "directive/text.js"() {
    init_core();
    dir("text", (el) => (
      // <template :text="a"/> or previously initialized template
      (el.content && el.replaceWith(el = frag(el).childNodes[0]), (value) => el.textContent = value == null ? "" : value)
    ));
  }
});

// directive/class.js
var init_class = __esm({
  "directive/class.js"() {
    init_core();
    dir(
      "class",
      (el, cur) => (cur = /* @__PURE__ */ new Set(), (v) => {
        let clsx = /* @__PURE__ */ new Set();
        if (v) {
          if (typeof v === "string") v.split(" ").map((cls) => clsx.add(cls));
          else if (Array.isArray(v)) v.map((v2) => v2 && clsx.add(v2));
          else Object.entries(v).map(([k, v2]) => v2 && clsx.add(k));
        }
        for (let cls of cur) if (clsx.has(cls)) clsx.delete(cls);
        else el.classList.remove(cls);
        for (let cls of cur = clsx) el.classList.add(cls);
      })
    );
  }
});

// directive/style.js
var init_style = __esm({
  "directive/style.js"() {
    init_core();
    dir(
      "style",
      (el, initStyle) => (initStyle = el.getAttribute("style"), (v) => {
        if (typeof v === "string") el.setAttribute("style", initStyle + (initStyle.endsWith(";") ? "" : "; ") + v);
        else {
          if (initStyle) el.setAttribute("style", initStyle);
          for (let k in v) k[0] == "-" ? el.style.setProperty(k, v[k]) : el.style[k] = v[k];
        }
      })
    );
  }
});

// directive/default.js
var mods, keys, throttle, debounce, attr, dashcase;
var init_default = __esm({
  "directive/default.js"() {
    init_core();
    dir("default", (target, state, expr, name) => {
      if (!name.startsWith("on"))
        return name ? (value) => attr(target, name, value) : (value) => {
          for (let key in value) attr(target, dashcase(key), value[key]);
        };
      let ctxs = name.split("..").map((e) => {
        let ctx = { evt: "", target, test: () => true };
        ctx.evt = (e.startsWith("on") ? e.slice(2) : e).replace(
          /\.(\w+)?-?([-\w]+)?/g,
          (_, mod, param = "") => (ctx.test = mods[mod]?.(ctx, ...param.split("-")) || ctx.test, "")
        );
        return ctx;
      });
      let addListener = (fn, { evt, target: target2, test, defer, stop, prevent, immediate, ...opts }, cb) => {
        if (defer) fn = defer(fn);
        cb = (e) => {
          try {
            test(e) && (stop && (immediate ? e.stopImmediatePropagation() : e.stopPropagation()), prevent && e.preventDefault(), fn?.call(state, e));
          } catch (error) {
            err(error, `:on${evt}`, fn);
          }
        };
        target2.addEventListener(evt, cb, opts);
        return () => target2.removeEventListener(evt, cb, opts);
      };
      if (ctxs.length == 1) return (v) => addListener(v, ctxs[0]);
      let startFn, nextFn, off, idx = 0;
      let nextListener = (fn) => {
        off = addListener((e) => (off(), nextFn = fn?.(e), (idx = ++idx % ctxs.length) ? nextListener(nextFn) : startFn && nextListener(startFn)), ctxs[idx]);
      };
      return (value) => (startFn = value, !off && nextListener(startFn), () => startFn = null);
    });
    mods = {
      // actions
      prevent(ctx) {
        ctx.prevent = true;
      },
      stop(ctx) {
        ctx.stop = true;
      },
      immediate(ctx) {
        ctx.immediate = true;
      },
      // options
      once(ctx) {
        ctx.once = true;
      },
      passive(ctx) {
        ctx.passive = true;
      },
      capture(ctx) {
        ctx.capture = true;
      },
      // target
      window(ctx) {
        ctx.target = window;
      },
      document(ctx) {
        ctx.target = document;
      },
      parent(ctx) {
        ctx.target = ctx.target.parentNode;
      },
      throttle(ctx, limit = 108) {
        ctx.defer = (fn) => throttle(fn, limit);
      },
      debounce(ctx, wait = 108) {
        ctx.defer = (fn) => debounce(fn, wait);
      },
      // test
      outside: (ctx) => (e) => {
        let target = ctx.target;
        if (target.contains(e.target)) return false;
        if (e.target.isConnected === false) return false;
        if (target.offsetWidth < 1 && target.offsetHeight < 1) return false;
        return true;
      },
      self: (ctx) => (e) => e.target === ctx.target,
      // keyboard
      ctrl: (_, ...param) => (e) => keys.ctrl(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
      shift: (_, ...param) => (e) => keys.shift(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
      alt: (_, ...param) => (e) => keys.alt(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
      meta: (_, ...param) => (e) => keys.meta(e) && param.every((p) => keys[p] ? keys[p](e) : e.key === p),
      // NOTE: we don't expose up/left/right/down as too verbose: can and better be handled/differentiated at once
      arrow: () => keys.arrow,
      enter: () => keys.enter,
      esc: () => keys.esc,
      tab: () => keys.tab,
      space: () => keys.space,
      delete: () => keys.delete,
      digit: () => keys.digit,
      letter: () => keys.letter,
      char: () => keys.char
    };
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
    throttle = (fn, limit) => {
      let pause, planned, block = (e) => {
        pause = true;
        setTimeout(() => {
          pause = false;
          if (planned) return planned = false, block(e), fn(e);
        }, limit);
      };
      return (e) => {
        if (pause) return planned = true;
        block(e);
        return fn(e);
      };
    };
    debounce = (fn, wait) => {
      let timeout;
      return (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          timeout = null;
          fn(e);
        }, wait);
      };
    };
    attr = (el, name, v) => {
      if (v == null || v === false) el.removeAttribute(name);
      else el.setAttribute(name, v === true ? "" : typeof v === "number" || typeof v === "string" ? v : "");
    };
    dashcase = (str) => {
      return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match, i) => (i ? "-" : "") + match.toLowerCase());
    };
  }
});

// directive/value.js
var init_value = __esm({
  "directive/value.js"() {
    init_core();
    init_core();
    init_signal();
    init_store();
    init_default();
    dir("value", (el, state, expr) => {
      const update = el.type === "text" || el.type === "" ? (value) => el.setAttribute("value", el.value = value == null ? "" : value) : el.tagName === "TEXTAREA" || el.type === "text" || el.type === "" ? (value, from, to) => (
        // we retain selection in input
        (from = el.selectionStart, to = el.selectionEnd, el.setAttribute("value", el.value = value == null ? "" : value), from && el.setSelectionRange(from, to))
      ) : el.type === "checkbox" ? (value) => (el.checked = value, attr(el, "checked", value)) : el.type === "select-one" ? (value) => {
        for (let o of el.options)
          o.value == value ? o.setAttribute("selected", "") : o.removeAttribute("selected");
        el.value = value;
      } : el.type === "select-multiple" ? (value) => {
        for (let o of el.options) o.removeAttribute("selected");
        for (let v of value) el.querySelector(`[value="${v}"]`).setAttribute("selected", "");
      } : (value) => el.value = value;
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
      return update;
    });
  }
});

// directive/fx.js
var init_fx = __esm({
  "directive/fx.js"() {
    init_core();
    dir("fx", (_) => (_2) => _2);
  }
});

// directive/aria.js
var init_aria = __esm({
  "directive/aria.js"() {
    init_core();
    init_default();
    dir("aria", (el) => (value) => {
      for (let key in value) attr(el, "aria-" + dashcase(key), value[key] == null ? null : value[key] + "");
    });
  }
});

// directive/data.js
var init_data = __esm({
  "directive/data.js"() {
    init_core();
    dir("data", (el) => (value) => {
      for (let key in value) el.dataset[key] = value[key];
    });
  }
});

// sprae.js
var sprae_exports = {};
__export(sprae_exports, {
  default: () => sprae_default
});
var sprae_default;
var init_sprae = __esm({
  "sprae.js"() {
    init_core();
    init_if();
    init_each();
    init_ref();
    init_with();
    init_text();
    init_class();
    init_style();
    init_value();
    init_fx();
    init_default();
    init_aria();
    init_data();
    core_default.use({ compile: (expr) => core_default.constructor(`with (arguments[0]) { return ${expr} };`) });
    sprae_default = core_default;
  }
});

// <stdin>
var sprae2 = (init_sprae(), __toCommonJS(sprae_exports)).default;
sprae2.store = (init_store(), __toCommonJS(store_exports)).default;
sprae2.use({ prefix: document.currentScript.getAttribute("prefix") });
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => sprae2()) : sprae2();
module.exports = sprae2;
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
