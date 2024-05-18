import { effect, untracked, use } from "./signal.js";
import store, { _signals } from './store.js';

// polyfill
const _dispose = (Symbol.dispose ||= Symbol("dispose"));

// mark
const SPRAE = `∴`

// reserved directives - order matters!
export const directive = {};

// sprae element: apply directives
const memo = new WeakMap();

export default function sprae(container, values) {
  if (!container.children) return // text nodes, comments etc - but collections are fine

  // repeated call can be caused by :each with new objects with old keys needs an update
  if (memo.has(container)) {
    const state = memo.get(container)
    // we rewrite signals instead of update, because user should have what he provided
    Object.assign(state, values)
  }

  // take over existing state instead of creating clone
  const state = store(values || {});

  init(container, state);

  // if element was spraed by :with or :each instruction - skip
  if (memo.has(container)) return state;

  // save
  memo.set(container, state);

  return state;
}

// init directives on a single element
function init(el, state, parent = el.parentNode, effects = []) {
  if (el.attributes) {
    // init generic-name attributes second
    for (let i = 0; i < el.attributes.length;) {
      let attr = el.attributes[i];

      if (attr.name[0] === ':') {
        el.removeAttribute(attr.name);

        // multiple attributes like :id:for=""
        let names = attr.name.slice(1).split(':')

        // NOTE: secondary directives don't stop flow nor extend state, so no need to check
        for (let name of names) {
          let dir = directive[name] || directive.default
          let evaluate = (dir.parse || parse)(attr.value, parse)
          let dispose = dir(el, evaluate, state, name);
          if (dispose) effects.push(dispose);
        }

        // stop if element was spraed by internal directive
        if (memo.has(el)) return;

        // stop if element is skipped (detached) like in case of :if or :each
        if (el.parentNode !== parent) return;
      } else i++;
    }
  }

  [...el.children].map(child => init(child, state, el))

  // mark spraed element
  el.classList?.add(SPRAE);
  el[_dispose] = () => {
    while (effects.length) effects.pop()();
    el.classList.remove(SPRAE);
    memo.delete(el);
    // NOTE: each child disposes own children etc.
    let els = el.getElementsByClassName(SPRAE);
    while (els.length) els[0][_dispose]?.()
  }
};

// compiler
const evalMemo = {};
const parse = (expr, dir, fn) => {
  if (fn = evalMemo[expr = expr.trim()]) return fn

  // static-time errors
  try { fn = compile(expr); }
  catch (e) { throw Object.assign(e, { message: `∴ ${e.message}\n\n${dir}${expr ? `="${expr}"\n\n` : ""}`, expr }) }

  // runtime errors
  return evalMemo[expr] = fn
}

export let compile

// configure signals/compile/differ
// it's more compact than using sprae.signal = signal etc.
sprae.use = s => {
  s.signal && use(s);
  s.compile && (compile = s.compile);
}
