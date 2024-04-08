import { directive } from "../core.js";

directive['data'] = (el, evaluate, state) => {
  return () => {
    let value = evaluate(state)?.valueOf()
    for (let key in value) el.dataset[key] = value[key];
  }
}
