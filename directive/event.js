import { call, parse, decorate } from "../core.js"

export default (el, state, expr, name) => {
  // wrap inline cb into function
  // if (!/^(?:[\w$]+|\([^()]*\))\s*=>/.test(expr) && !/^function\b/.test(expr)) expr = `()=>{${expr}}`;

  const [type, ...mods] = name.slice(2).split('.'),
    evaluate = parse(expr).bind(el),
    trigger = decorate(Object.assign(e => evaluate(state, (fn) => fn && call(fn, e)), { target: el }), mods);

  trigger.target.addEventListener(type, trigger, trigger)
  return {
    [Symbol.dispose]() {
      trigger.target.removeEventListener(type, trigger)
    }
  }
}
