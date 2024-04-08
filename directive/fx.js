import { directive } from "../core.js";

directive.fx = (el, evaluate, state) => {
  return () => evaluate(state);
};
