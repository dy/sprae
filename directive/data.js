import { directive } from "../core.js";
import { effect } from "../signal.js";

directive['data'] = (el, evaluate, state) => {
  return effect(() => {
    let value = evaluate(state)
    for (let key in value) el.dataset[key] = value[key];
  })
}
