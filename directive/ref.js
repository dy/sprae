import { directive } from "../core.js";
import { ipol } from './default.js';
import { batch, untracked } from '../signal.js';

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  let prev;
  return () => {
    let name = ipol(expr, state)
    if (prev !== name) {
      if (prev) delete state[prev]
      state[prev = name] = el;
    }
  }
}

directive.ref.parse = expr => expr
