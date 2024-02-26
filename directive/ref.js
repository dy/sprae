import { directive } from "../src/core.js";

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  state[expr] = el;
};
