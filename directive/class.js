import { directive } from "../core.js";
import { ipol } from './default.js';

directive.class = (el, evaluate, state) => {
  let cur = new Set
  return () => {
    let v = evaluate(state);
    let clsx = new Set;
    if (v) {
      if (typeof v === "string") ipol(v?.valueOf?.(), state).split(' ').map(cls => clsx.add(cls));
      else if (Array.isArray(v)) v.map(v => (v = ipol(v?.valueOf?.(), state)) && clsx.add(v));
      else Object.entries(v).map(([k, v]) => v?.valueOf?.() && clsx.add(k));
    }
    for (let cls of cur) if (clsx.has(cls)) clsx.delete(cls); else el.classList.remove(cls);
    for (let cls of cur = clsx) el.classList.add(cls)
  };
};
