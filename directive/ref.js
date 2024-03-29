import { directive, ipol } from "../core.js";

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  let prev;
  return () => {
    if (prev) delete state[prev]
    state[prev = ipol(expr, state)] = el;
  }
};
