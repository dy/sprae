import { directive, parse } from "../core.js";

// ref must be last within primaries, since that must be skipped by :each, but before secondaries
directive.ref = (el, expr, state) => {
  const evaluate = parse(expr)
  return () => evaluate(state)?.call?.(null, el)
}
