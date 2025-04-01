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
var _signals, _change, store, list, mut, set, store_default;
var init_store = __esm({
  "store.js"() {
    init_signal();
    _signals = Symbol("signals");
    _change = Symbol("change");
    store = (values, parent) => {
      if (!values) return values;
      if (values[_signals]) return values;
      if (Array.isArray(values)) return list(values);
      if (values.constructor !== Object || values[Symbol.toStringTag]) return values;
      let signals = { ...parent?.[_signals] }, _len = signal(Object.values(values).length);
      const state = new Proxy(signals, {
        get: (_, key) => key === _change ? _len : key === _signals ? signals : signals[key]?.valueOf(),
        set: (_, key, v, s) => (s = signals[key], set(signals, key, v), s ?? ++_len.value, 1),
        // bump length for new signal
        deleteProperty: (_, key) => (signals[key] && (signals[key][Symbol.dispose]?.(), delete signals[key], _len.value--), 1),
        // subscribe to length when object is spread
        ownKeys: () => (_len.value, Reflect.ownKeys(signals))
      });
      for (let key in values) {
        const desc = Object.getOwnPropertyDescriptor(values, key);
        if (desc?.get) {
          (signals[key] = computed(desc.get.bind(state)))._set = desc.set?.bind(state);
        } else {
          signals[key] = null;
          set(signals, key, values[key]);
        }
      }
      return state;
    };
    list = (values) => {
      let lastProp;
      if (values[_signals]) return values;
      let _len = signal(values.length), signals = Array(values.length).fill();
      const state = new Proxy(signals, {
        get(_, key) {
          if (typeof key === "symbol") return key === _change ? _len : key === _signals ? signals : signals[key];
          if (key === "length") return mut.includes(lastProp) ? _len.peek() : _len.value;
          lastProp = key;
          if (signals[key]) return signals[key].valueOf();
          if (key < signals.length) return (signals[key] = signal(store(values[key]))).value;
        },
        set(_, key, v) {
          if (key === "length") {
            for (let i = v; i < signals.length; i++) delete state[i];
            _len.value = signals.length = v;
            return true;
          }
          set(signals, key, v);
          if (key >= _len.peek()) _len.value = signals.length = +key + 1;
          return true;
        },
        deleteProperty: (_, key) => (signals[key]?.[Symbol.dispose]?.(), delete signals[key], 1)
      });
      return state;
    };
    mut = ["push", "pop", "shift", "unshift", "splice"];
    set = (signals, key, v) => {
      let s = signals[key];
      if (key[0] === "_") signals[key] = v;
      else if (!s) signals[key] = s = v?.peek ? v : signal(store(v));
      else if (v === s.peek()) ;
      else if (s._set) s._set(v);
      else if (Array.isArray(v) && Array.isArray(s.peek())) {
        const cur = s.peek();
        if (cur[_change]) batch(() => {
          for (let i = 0; i < v.length; i++) cur[i] = v[i];
          cur.length = v.length;
        });
        else s.value = v;
      } else s.value = store(v);
    };
    store_default = store;
  }
});

// core.js
function sprae(el, values) {
  if (el[_state]) return Object.assign(el[_state], values);
  const state = store(values || {}), offs = [], fx = [];
  const init = (el2, attrs = el2.attributes) => {
    if (attrs) for (let i = 0; i < attrs.length; ) {
      let { name, value } = attrs[i], pfx, update, dir2;
      if (pfx = name[0] === ":" ? 1 : name[0] === "s" && name[1] === "-" ? 2 : 0) {
        el2.removeAttribute(name);
        for (dir2 of name.slice(pfx).split(":")) {
          update = (directive[dir2] || directive.default)(el2, value, state, dir2);
          fx.push(update), offs.push(effect(update));
          if (el2[_state] === null) return;
        }
      } else i++;
    }
    for (let child of el2.childNodes) child.nodeType == 1 && init(child);
  };
  init(el);
  if (!(_state in el)) {
    el[_state] = state;
    el[_off] = () => {
      while (offs.length) offs.pop()();
    };
    el[_on] = () => offs.push(...fx.map((f) => effect(f)));
    el[_dispose] = () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null);
  }
  return state;
}
var _dispose, _state, _on, _off, directive, dir, parse, memo, err, compile, frag;
var init_core = __esm({
  "core.js"() {
    init_signal();
    init_store();
    _dispose = Symbol.dispose || (Symbol.dispose = Symbol("dispose"));
    _state = Symbol("state");
    _on = Symbol("on");
    _off = Symbol("off");
    directive = {};
    dir = (name, create, p = parse) => directive[name] = (el, expr, state, name2, update, evaluate) => (evaluate = p(expr), update = create(el, state, expr, name2, evaluate), () => update(evaluate(state)));
    parse = (expr, dir2, fn) => {
      if (fn = memo[expr = expr.trim()]) return fn;
      try {
        fn = compile(expr);
      } catch (e) {
        err(e, dir2, expr);
      }
      return memo[expr] = fn;
    };
    memo = {};
    err = (e, dir2 = "", expr = "") => {
      throw Object.assign(e, { message: `\u2234 ${e.message}

${dir2}${expr ? `="${expr}"

` : ""}`, expr });
    };
    sprae.use = (s) => {
      s.signal && use(s);
      s.compile && (compile = s.compile);
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
  }
});

// directive/if.js
var _prevIf;
var init_if = __esm({
  "directive/if.js"() {
    init_core();
    _prevIf = Symbol("if");
    dir("if", (el, state) => {
      const holder = document.createTextNode("");
      let next = el.nextElementSibling, curEl, ifEl, elseEl;
      el.replaceWith(holder);
      ifEl = el.content ? frag(el) : el;
      ifEl[_state] = null;
      if (next?.hasAttribute(":else")) {
        next.removeAttribute(":else");
        if (!next.hasAttribute(":if")) next.remove(), elseEl = next.content ? frag(next) : next, elseEl[_state] = null;
      }
      return (value) => {
        const newEl = value ? ifEl : el[_prevIf] ? null : elseEl;
        if (next) next[_prevIf] = newEl === ifEl;
        if (curEl != newEl) {
          if (curEl) curEl.remove(), curEl[_off]?.();
          if (curEl = newEl) {
            holder.before(curEl.content || curEl);
            curEl[_state] === null ? (delete curEl[_state], sprae(curEl, state)) : curEl[_on]();
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
        const [itemVar, idxVar = "$"] = expr.split(/\s+in\s+/)[0].split(/\s*,\s*/);
        const holder = document.createTextNode("");
        tpl.replaceWith(holder);
        tpl[_state] = null;
        let cur, keys2, items, prevl = 0;
        const update = () => {
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
              sprae(el, scope);
              ((_b = cur[_a = _signals] || (cur[_a] = []))[i] || (_b[i] = {}))[Symbol.dispose] = () => {
                el[Symbol.dispose]?.(), el.remove();
              };
            }
          }
          prevl = newl;
        };
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
      (expr) => parse(expr.split(/\s+in\s+/)[1])
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
      const ctxs = name.split("..").map((e) => {
        let ctx = { evt: "", target, test: () => true };
        ctx.evt = (e.startsWith("on") ? e.slice(2) : e).replace(
          /\.(\w+)?-?([-\w]+)?/g,
          (_, mod, param = "") => (ctx.test = mods[mod]?.(ctx, ...param.split("-")) || ctx.test, "")
        );
        return ctx;
      });
      const addListener = (fn, { evt, target: target2, test, defer, stop, prevent, immediate, ...opts }) => {
        if (defer) fn = defer(fn);
        const cb = (e) => {
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
      const nextListener = (fn) => {
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
      throttle(ctx, limit) {
        ctx.defer = (fn) => throttle(fn, limit ? Number(limit) || 0 : 108);
      },
      debounce(ctx, wait) {
        ctx.defer = (fn) => debounce(fn, wait ? Number(wait) || 0 : 108);
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
var setter, ensure;
var init_value = __esm({
  "directive/value.js"() {
    init_core();
    init_core();
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
      ensure(state, expr);
      try {
        const set2 = setter(expr);
        const handleChange = el.type === "checkbox" ? () => set2(state, el.checked) : el.type === "select-multiple" ? () => set2(state, [...el.selectedOptions].map((o) => o.value)) : () => set2(state, el.selectedIndex < 0 ? null : el.value);
        el.oninput = el.onchange = handleChange;
        if (el.type?.startsWith("select")) {
          new MutationObserver(handleChange).observe(el, { childList: true, subtree: true, attributes: true });
          sprae(el, state);
        }
      } catch {
      }
      return update;
    });
    setter = (expr, set2 = parse(`${expr}=__`)) => (
      // FIXME: if there's a simpler way to set value in justin?
      (state, value) => (state.__ = value, set2(state, value), delete state.__)
    );
    ensure = (state, expr, name = expr.match(/^\w+(?=\s*(?:\.|\[|$))/)) => {
      var _a;
      return name && (state[_a = name[0]] ?? (state[_a] = null));
    };
  }
});

// directive/ref.js
var init_ref = __esm({
  "directive/ref.js"() {
    init_core();
    init_value();
    dir("ref", (el, state, expr, _, ev) => (ensure(state, expr), ev(state) == null ? (setter(expr)(state, el), (_2) => _2) : (v) => v.call(null, el)));
  }
});

// directive/with.js
var init_with = __esm({
  "directive/with.js"() {
    init_core();
    init_store();
    dir("with", (el, rootState, state) => (state = null, (values) => sprae(el, state ? values : state = store_default(values, rootState))));
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
    sprae.use({ compile: (expr) => sprae.constructor(`with (arguments[0]) { return ${expr} };`) });
    sprae_default = sprae;
  }
});

// sprae.umd.cjs
var { default: sprae2 } = (init_sprae(), __toCommonJS(sprae_exports));
module.exports = sprae2;
if (document.currentScript?.hasAttribute("init")) {
  const props = JSON.parse(document.currentScript?.getAttribute("init") || "{}");
  const init = () => {
    sprae2(document.documentElement, props);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
}
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
