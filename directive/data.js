import { directive } from "../core.js";
import { effect } from "../signal.js";

const lowerCaseFirst = str => `${str.charAt(0).toLowerCase()}${str.slice(1)}`;

directive['data'] = (el, evaluate, state) => {
  return effect(() => {
    let value = evaluate(state)
    for (let key in value) el.dataset[lowerCaseFirst(key)] = value[key];
  })
}
