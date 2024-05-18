import { directive } from "../core.js";
import { ipol } from './default.js';
import { effect } from "../signal.js";

directive.class = (el, evaluate, state) => {
  let cur = new Set
  return effect(() => {
    let v = evaluate(state);
    let clsx = new Set;
    if (v) {
      if (typeof v === "string") ipol(v, state).split(' ').map(cls => clsx.add(cls));
      else if (Array.isArray(v)) v.map(v => (v = ipol(v, state)) && clsx.add(v));
      else Object.entries(v).map(([k, v]) => v && clsx.add(k));
    }
    for (let cls of cur) if (clsx.has(cls)) clsx.delete(cls); else el.classList.remove(cls);
    for (let cls of cur = clsx) el.classList.add(cls)
  });
};
