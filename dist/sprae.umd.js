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

// core.js
var _dispose, _state, _on, _off, _add, prefix, signal, effect, computed, batch, untracked, directive, modifier, sprae, initDirective, use, start, compile, parse, cache, trim, applyMods, sx, setter, frag, call, dashcase, attr, clsx, throttle, core_default;
var init_core = __esm({
  "core.js"() {
    init_store();
    init_store();
    _dispose = Symbol.dispose || (Symbol.dispose = Symbol("dispose"));
    _state = Symbol("state");
    _on = Symbol("on");
    _off = Symbol("off");
    _add = Symbol("add");
    prefix = ":";
    batch = (fn) => fn();
    untracked = batch;
    directive = {};
    modifier = {};
    sprae = (el2 = document.body, state) => {
      if (el2[_state]) return Object.assign(el2[_state], state);
      state = store_default(state || {});
      let fx = [], offs = [], fn, on = () => !offs && (offs = fx.map((fn2) => fn2())), off = () => (offs?.map((off2) => off2()), offs = null);
      el2[_on] = on;
      el2[_off] = off;
      el2[_dispose] || (el2[_dispose] = () => (el2[_off](), el2[_off] = el2[_on] = el2[_dispose] = el2[_state] = el2[_add] = null));
      const add = (el3, _attrs = el3.attributes) => {
        if (_attrs) for (let i = 0; i < _attrs.length; ) {
          let { name, value } = _attrs[i];
          if (name.startsWith(prefix)) {
            el3.removeAttribute(name);
            fx.push(fn = initDirective(el3, name, value, state));
            offs.push(fn());
            if (_state in el3) return;
          } else i++;
        }
        for (let child of [...el3.childNodes]) child.nodeType == 1 && add(child);
      };
      el2[_add] = add;
      add(el2);
      if (el2[_state] === void 0) el2[_state] = state;
      return state;
    };
    initDirective = (el2, attrName, expr, state) => {
      let cur, off;
      let steps = attrName.slice(prefix.length).split("..").map((step, i, { length }) => (
        // multiple attributes like :id:for=""
        step.split(prefix).reduce((prev2, str) => {
          let [name, ...mods] = str.split("."), evaluate = parse(name, expr, directive[name]?.clean);
          if (name.startsWith("on")) {
            let type = name.slice(2), first = (e) => call(evaluate(state), e), fn2 = applyMods(
              Object.assign(
                // single event vs chain
                length == 1 ? first : (e) => (cur = (!i ? first : cur)(e), off(), off = steps[(i + 1) % length]()),
                { target: el2, type }
              ),
              mods
            );
            return (_poff) => (_poff = prev2?.(), fn2.target.addEventListener(type, fn2, fn2), () => (_poff?.(), fn2.target.removeEventListener(type, fn2)));
          }
          let update = (directive[name] || directive["*"])(el2, state, expr, name);
          if (!mods.length && !prev2) return () => update && effect(() => update(evaluate(state)));
          let dispose, change = signal(-1), count = -1, fn = throttle(applyMods(() => {
            if (++change.value) return;
            dispose = effect(() => update && (change.value == count ? fn() : (
              // separate tick makes sure planner effect call is finished before real eval call
              (count = change.value, update(evaluate(state)))
            )));
          }, mods));
          return (_poff) => (_poff = prev2?.(), // console.log('ON', name),
          fn(), {
            [name]: () => (
              // console.log('OFF', name, el),
              (_poff?.(), dispose(), change.value = -1, count = dispose = null)
            )
          }[name]);
        }, null)
      ));
      return () => off = steps[0]();
    };
    use = (s) => (s.directive && (directive = s.directive), s.modifier && (modifier = s.modifier), s.compile && (compile = s.compile), s.prefix && (prefix = s.prefix), s.signal && (signal = s.signal), s.effect && (effect = s.effect), s.computed && (computed = s.computed), s.batch && (batch = s.batch), s.untracked && (untracked = s.untracked));
    start = (root = document.body, values) => {
      const state = store_default(values);
      sprae(root, state);
      const mo = new MutationObserver((mutations) => {
        for (const m of mutations) {
          for (const el2 of m.addedNodes) {
            if (el2.nodeType === 1 && el2[_state] === void 0) {
              for (const attr2 of el2.attributes) {
                if (attr2.name.startsWith(prefix)) {
                  root[_add](el2);
                  break;
                }
              }
            }
          }
        }
      });
      mo.observe(root, { childList: true, subtree: true });
      return state;
    };
    parse = (dir, expr, _clean = trim, _fn) => {
      if (_fn = cache[expr = _clean(expr)]) return _fn;
      try {
        _fn = compile(expr);
      } catch (e) {
        console.error(`\u2234 ${e}

${prefix + dir}="${expr}"`);
      }
      return cache[expr] = (s) => {
        try {
          return _fn?.(s);
        } catch (e) {
          console.error(`\u2234 ${e}

${prefix + dir}="${expr}"`);
        }
      };
    };
    cache = {};
    trim = (e) => e.trim();
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
    setter = (dir, expr, _set2 = parse(dir, `${expr}=__`)) => (target, value) => {
      target.__ = value;
      _set2(target), delete target.__;
    };
    frag = (tpl) => {
      if (!tpl.nodeType) return tpl;
      let content = tpl.content.cloneNode(true), attributes = [...tpl.attributes], ref = document.createTextNode(""), childNodes = (content.append(ref), [...content.childNodes]);
      return {
        // get parentNode() { return childNodes[0].parentNode },
        childNodes,
        content,
        remove: () => content.append(...childNodes),
        replaceWith(el2) {
          if (el2 === ref) return;
          ref.before(el2);
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
    attr = (el2, name, v) => v == null || v === false ? el2.removeAttribute(name) : el2.setAttribute(name, v === true ? "" : v);
    clsx = (c, _out = []) => !c ? "" : typeof c === "string" ? c : (Array.isArray(c) ? c.map(clsx) : Object.entries(c).reduce((s, [k, v]) => !v ? s : [...s, k], [])).join(" ");
    throttle = (fn, schedule = queueMicrotask) => {
      let _planned = 0;
      const throttled = (e) => {
        if (!_planned++) fn(e), schedule((_dirty = _planned > 1) => (_planned = 0, _dirty && throttled(e)));
      };
      return throttled;
    };
    core_default = sprae;
  }
});

// store.js
var mut, _signals, _change, _set, store, list, create, set, meta, store_default;
var init_store = __esm({
  "store.js"() {
    init_core();
    mut = ["push", "pop", "shift", "unshift", "splice"];
    _signals = Symbol("signals");
    _change = Symbol("change");
    _set = Symbol("set");
    store = (values, parent = globalThis) => {
      if (!values) return values;
      if (values[Symbol.toStringTag]) return values;
      if (values[_signals]) return values;
      if (values.constructor !== Object) return Array.isArray(values) ? list(values) : values;
      let len = Object.keys(values).length, signals = {};
      let state = new Proxy(meta(signals, len), {
        get: (_, k) => k in signals ? signals[k] ? signals[k].valueOf() : signals[k] : parent[k],
        set: (_, k, v, _s) => (k in signals ? set(signals, k, v) : (create(signals, k, v), signals[_change].value = ++len), 1),
        // bump length for new signal
        // FIXME: try to avild calling Symbol.dispose here
        deleteProperty: (_, k) => (k in signals && (k[0] != "_" && signals[k]?.[Symbol.dispose]?.(), delete signals[k], signals[_change].value = --len), 1),
        // subscribe to length when object is spread
        ownKeys: () => (signals[_change].value, Reflect.ownKeys(signals)),
        has: (_) => 1
        // sandbox prevents writing to global
      }), descs = Object.getOwnPropertyDescriptors(values);
      for (let k in values) {
        if (descs[k]?.get)
          (signals[k] = computed(descs[k].get.bind(state)))[_set] = descs[k].set?.bind(state);
        else create(signals, k, values[k]);
      }
      return state;
    };
    list = (values, parent = globalThis) => {
      let lastProp, signals = Array(values.length).fill(null), state = new Proxy(
        meta(signals, signals.length),
        {
          get(_, k) {
            if (k === "length") return mut.includes(lastProp) ? signals.length : signals[_change].value;
            lastProp = k;
            return signals[k] ? signals[k].valueOf() : k in signals ? (signals[k] = signal(store(values[k]))).valueOf() : parent[k];
          },
          set(_, k, v) {
            if (k === "length") {
              for (let i = v; i < signals.length; i++) delete state[i];
              signals[_change].value = signals.length = v;
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
    meta = (signals, len) => Object.assign(signals, { [_change]: signal(len), [_signals]: signals });
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
    effect2 = (fn, _teardown, _fx, _deps, __tmp) => (_fx = (prev2) => {
      __tmp = _teardown;
      _teardown = null;
      __tmp?.call?.();
      prev2 = current, current = _fx;
      if (depth++ > 10) throw "Cycle detected";
      try {
        _teardown = fn();
      } finally {
        current = prev2;
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
    if_default = (el2, state, _holder, _el, _match) => {
      var _a;
      if (!el2._holder) {
        el2[_a = _state] ?? (el2[_a] = null);
        _el = el2.content ? frag(el2) : el2;
        el2.replaceWith(_holder = document.createTextNode(""));
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
      } else core_default(_el = el2, state);
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
    else_default = (el2, state, _el, _, _prev = el2) => {
      _el = el2.content ? frag(el2) : el2;
      while (_prev && !(_el._holder = _prev._holder)) _prev = _prev.previousSibling;
      el2.remove();
      el2[_state] = null;
      _el._holder._clauses.push(_el._clause = [_el, true]);
      return () => {
        _el._holder.update();
      };
    };
  }
});

// directive/text.js
var text_default;
var init_text = __esm({
  "directive/text.js"() {
    init_core();
    text_default = (el2) => (
      // <template :text="a"/> or previously initialized template
      // FIXME: replace with content maybe?
      (el2.content && el2.replaceWith(el2 = frag(el2).childNodes[0]), (v) => (v = call(v, el2.textContent), el2.textContent = v == null ? "" : v))
    );
  }
});

// directive/class.js
var class_default;
var init_class = __esm({
  "directive/class.js"() {
    init_core();
    class_default = (el2, _cur, _new) => (_cur = /* @__PURE__ */ new Set(), (v) => {
      _new = /* @__PURE__ */ new Set();
      if (v) clsx(call(v, el2.className)).split(" ").map((c) => c && _new.add(c));
      for (let c of _cur) if (_new.has(c)) _new.delete(c);
      else el2.classList.remove(c);
      for (let c of _cur = _new) el2.classList.add(c);
    });
  }
});

// directive/style.js
var style_default;
var init_style = __esm({
  "directive/style.js"() {
    init_core();
    style_default = (el2, _static) => (_static = el2.getAttribute("style"), (v) => {
      v = call(v, el2.style);
      if (typeof v === "string") attr(el2, "style", _static + "; " + v);
      else {
        if (_static) attr(el2, "style", _static);
        for (let k in v) k[0] == "-" ? el2.style.setProperty(k, v[k]) : k[0] > "A" && (el2.style[k] = v[k]);
      }
    });
  }
});

// directive/fx.js
var fx_default;
var init_fx = __esm({
  "directive/fx.js"() {
    init_core();
    fx_default = () => (v) => call(v);
  }
});

// directive/value.js
var value_default;
var init_value = __esm({
  "directive/value.js"() {
    init_core();
    value_default = (el2, state, expr, name) => {
      try {
        const set2 = setter(name, expr);
        const handleChange = el2.type === "checkbox" ? () => set2(state, el2.checked) : el2.type === "select-multiple" ? () => set2(state, [...el2.selectedOptions].map((o) => o.value)) : () => set2(state, el2.selectedIndex < 0 ? null : el2.value);
        el2.oninput = el2.onchange = handleChange;
        if (el2.type?.startsWith("select")) {
          new MutationObserver(handleChange).observe(el2, { childList: true, subtree: true, attributes: true });
          core_default(el2, state);
        }
        cache[trim(expr)](state) ?? handleChange();
      } catch {
      }
      return el2.type === "text" || el2.type === "" ? (value) => el2.setAttribute("value", el2.value = value == null ? "" : value) : el2.tagName === "TEXTAREA" || el2.type === "text" || el2.type === "" ? (value, from, to) => (
        // we retain selection in input
        (from = el2.selectionStart, to = el2.selectionEnd, el2.setAttribute("value", el2.value = value == null ? "" : value), from && el2.setSelectionRange(from, to))
      ) : el2.type === "checkbox" ? (value) => (el2.checked = value, attr(el2, "checked", value)) : el2.type === "radio" ? (value) => el2.value === value && (el2.checked = value, attr(el2, "checked", value)) : el2.type === "select-one" ? (value) => {
        for (let o of el2.options)
          o.value == value ? o.setAttribute("selected", "") : o.removeAttribute("selected");
        el2.value = value;
      } : el2.type === "select-multiple" ? (value) => {
        for (let o of el2.options) o.removeAttribute("selected");
        for (let v of value) el2.querySelector(`[value="${v}"]`).setAttribute("selected", "");
      } : (value) => el2.value = value;
    };
  }
});

// directive/ref.js
var ref_default;
var init_ref = __esm({
  "directive/ref.js"() {
    init_core();
    ref_default = (el2, state, expr, name, _prev, _set2) => typeof cache[trim(expr)](state) == "function" ? (v) => v(el2) : (
      // NOTE: we have to set element statically (outside of effect) to avoid parasitic sub - multiple els with same :ref can cause recursion (eg. :each :ref="x")
      setter(name, expr)(state, el2)
    );
  }
});

// directive/scope.js
var scope_default;
var init_scope = __esm({
  "directive/scope.js"() {
    init_core();
    scope_default = (el2, rootState, _scope) => (
      // prevent subsequent effects
      (el2[_state] = null, // 0 run pre-creates state to provide scope for the first effect - it can write vars in it, so we should already have it
      _scope = store({}, rootState), // 1st run spraes subtree with values from scope - it can be postponed by modifiers (we isolate reads from parent effect)
      // 2nd+ runs update _scope
      (values) => (Object.assign(_scope, call(values, _scope)), el2[_state] ?? (delete el2[_state], untracked(() => core_default(el2, _scope)))))
    );
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
      let cur, keys2, items, prevl = 0;
      let update = throttle(() => {
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
            let idx = i, subscope = store({
              // NOTE: since we simulate signal, we have to make sure it's actual signal, not fake one
              // FIXME: try to avoid this, we also have issue with wrongly calling dispose in store on delete
              [itemVar]: cur[_signals]?.[idx]?.peek ? cur[_signals]?.[idx] : cur[idx],
              [idxVar]: keys2 ? keys2[idx] : idx
            }, state);
            let el2 = tpl.content ? frag(tpl) : tpl.cloneNode(true);
            holder.before(el2.content || el2);
            core_default(el2, subscope);
            let _prev = ((_b = cur[_a = _signals] || (cur[_a] = []))[i] || (_b[i] = {}))[Symbol.dispose];
            cur[_signals][i][Symbol.dispose] = () => {
              _prev?.(), el2[Symbol.dispose]?.(), el2.remove();
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
    each.clean = (str) => str.split(/\bin\b/)[1].trim();
    each_default = each;
  }
});

// directive/default.js
var default_default;
var init_default = __esm({
  "directive/default.js"() {
    init_core();
    default_default = (el2, st, ex, name) => (v) => attr(el2, name, call(v, el2.getAttribute(name)));
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
var directive2, modifier2, keys, sprae_default;
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
    directive2 = {
      // :x="x"
      "*": default_default,
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
    };
    modifier2 = {
      // FIXME: add -s, -m, -l classes with values
      debounce: (fn, _how = 250, _schedule = _how === "tick" ? queueMicrotask : _how === "raf" ? requestAnimationFrame : _how === "idle" ? requestIdleCallback : (fn2) => setTimeout(fn2, _how), _count = 0) => (e, _planned = ++_count) => _schedule(() => _planned == _count && fn(e)),
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
      window: (fn) => (fn.target = window, fn),
      document: (fn) => (fn.target = document, fn),
      parent: (fn) => (fn.target = fn.target.parentNode, fn),
      // test
      self: (fn) => (e) => e.target === fn.target && fn(e),
      // FIXME
      outside: (fn) => (e, _target) => (_target = fn.target, !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight))
      // FIXME:
      //screen: fn => ()
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
    for (let k in keys) modifier2[k] = (fn, ...params) => (e) => keys[k](e) && params.every((k2) => keys[k2]?.(e) ?? e.key === k2) && fn(e);
    use({
      directive: directive2,
      modifier: modifier2,
      // indirect new Function to avoid detector
      compile: (expr) => core_default.constructor(`with (arguments[0]) { return ${expr} };`),
      // signals
      signal: signal2,
      effect: effect2,
      computed: computed2,
      batch: batch2,
      untracked: untracked2
    });
    sprae_default = core_default;
  }
});

// <stdin>
var { default: sprae2, use: use2, start: start2 } = (init_sprae(), __toCommonJS(sprae_exports));
module.exports = sprae2;
use2({ prefix: document.currentScript.getAttribute("prefix") || document.currentScript.dataset.spraePrefix || ":" });
start2();
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
