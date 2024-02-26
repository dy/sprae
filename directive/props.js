import { directive } from "../src/core.js";

// spread props
directive[''] = (el, expr, state) => {
  let evaluate = parse(el, expr);
  return evaluate && effect(() => {
    let value = evaluate(state);
    for (let key in value) attr(el, dashcase(key), value[key]);
  });
}
