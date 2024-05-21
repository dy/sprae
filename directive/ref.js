import { signal } from "../signal.js";
import { directive } from "../core.js";
import { _change, _signals } from "../store.js";
import { ipol } from './default.js';

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  state[_signals][ipol(expr, state)] = signal(el)
}

directive.ref.parse = expr => expr
