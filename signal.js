// preact-signals minimal implementation
let current, depth = 0, batched;

// default signals impl

export let signal = (v, _s, _obs = new Set, _v = () => _s.value) => (
  _s = {
    get value() {
      current?.deps.push(_obs.add(current));
      return v
    },
    set value(val) {
      if (val === v) return
      v = val;
      for (let sub of _obs) batched ? batched.add(sub) : sub(); // notify effects
    },
    peek() { return v },
    toJSON: _v, then: _v, toString: _v, valueOf: _v
  }
)

export let effect = (fn, _teardown, _fx, _deps) => (
  _fx = (prev) => {
    _teardown?.call?.();
    prev = current, current = _fx
    if (depth++ > 10) throw 'Cycle detected';
    try { _teardown = fn(); } finally { current = prev; depth-- }
  },
  _deps = _fx.deps = [],

  _fx(),
  (dep) => { _teardown?.call?.(); while (dep = _deps.pop()) dep.delete(_fx); }
)

export let computed = (fn, _s = signal(), _c, _e, _v = () => _c.value) => (
  _c = {
    get value() {
      _e ||= effect(() => _s.value = fn());
      return _s.value
    },
    peek: _s.peek,
    toJSON: _v, then: _v, toString: _v, valueOf: _v
  }
)

export let batch = (fn, _first = !batched) => {
  batched ??= new Set;
  try { fn(); }
  finally { if (_first) { for (const fx of batched) fx(); batched = null } }
}

export let untracked = (fn, _prev, _v) => (_prev = current, current = null, _v = fn(), current = _prev, _v)


// signals adapter - allows switching signals implementation and not depend on core
export const use = (s) => (
  signal = s.signal,
  effect = s.effect,
  computed = s.computed,
  batch = s.batch || batch,
  untracked = s.untracked || batch
)

export default {
  signal,
  effect,
  untracked,
  computed,
  batch
}
