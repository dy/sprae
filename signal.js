// preact-signals minimal implementation
let current, depth = 0, batched;

// default signals impl

export const signal = (v, _s, _obs = new Set, _v = () => _s.value) => (
  _s = {
    get value() {
      current?.deps.add(_obs.add(current));
      return v
    },
    set value(val) {
      if (val === v) return
      v = val;
      for (let sub of _obs) batched ? batched.add(sub) : sub(); // notify effects
    },
    peek() { return v },
    toJSON: _v, toString: _v, valueOf: _v
  }
)

export const effect = (fn, _teardown, _fx, _deps) => (
  _fx = (prev) => {
    let tmp = _teardown;
    _teardown = null; // we null _teardown to avoid repeated call in case of recursive update
    tmp?.call?.();
    prev = current, current = _fx
    if (depth++ > 10) throw 'Cycle detected';
    try { _teardown = fn() } finally { current = prev; depth-- }
  },
  _fx.fn = fn,
  _deps = _fx.deps = new Set(),

  _fx(),
  (dep) => { _teardown?.call?.(); for (dep of _deps) dep.delete(_fx); _deps.clear() }
)

export const computed = (fn, _s = signal(), _c, _e, _v = () => _c.value) => (
  _c = {
    get value() {
      _e ||= effect(() => _s.value = fn());
      return _s.value
    },
    peek: _s.peek,
    toJSON: _v, toString: _v, valueOf: _v
  }
)

export const batch = (fn, _first = !batched, _list) => {
  batched ??= new Set;
  try { fn(); }
  finally { if (_first) { [batched, _list] = [null, batched]; for (const fx of _list) fx(); } }
}

export const untracked = (fn, _prev, _v) => (_prev = current, current = null, _v = fn(), current = _prev, _v)
