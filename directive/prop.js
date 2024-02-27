import { directive, parse } from "../src/core.js";
import { effect } from '../src/signal.js'

// spread props
directive[''] = (el, expr, state) => {
  let evaluate = parse(el, expr);
  return evaluate && effect(() => {
    let value = evaluate(state);
    for (let key in value) attr(el, dashcase(key), value[key]);
  });
}

const dashcase = (str) => {
  return str.replace(/[A-Z\u00C0-\u00D6\u00D8-\u00DE]/g, (match) => "-" + match.toLowerCase());
}
