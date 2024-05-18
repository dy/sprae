import { directive } from "../core.js";
import { effect } from "../signal.js";

directive.fx = (el, evaluate, state) => {
  return effect(() => evaluate(state));
};
