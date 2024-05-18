import { directive } from "../core.js";
import { _change, _signals } from "../store.js";
import { ipol } from './default.js';

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  // defining prop is needed for inherited scope, like :each or :with, since el cannot be signal
  Object.defineProperty(state, ipol(expr, state), { value: el })
}

directive.ref.parse = expr => expr
