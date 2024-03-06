import swapdom from 'swapdom'
import * as signals from 'ulive'

// polyfill
const _dispose = (Symbol.dispose ||= Symbol("dispose"));

// mark
const SPRAE = `∴`

// signals impl
export let { signal, effect, batch, computed, untracked } = signals;

// reserved directives - order matters!
export const directive = {};

// sprae element: apply directives
const memo = new WeakMap();
export default function sprae(container, values) {
  if (!container.children) return // text nodes, comments etc

  // repeated call can be caused by :each with new objects with old keys needs an update
  if (memo.has(container)) {
    const [state, effects] = memo.get(container)
    // we rewrite signals instead of update, because user should have what he provided
    // console.log(container, state, values)
    for (let k in values) state[k] = values[k]
    for (let fx of effects) fx()
  }

  // take over existing state instead of creating clone
  const state = values || {};
  const effects = [];

  // init directives on element
  const init = (el, parent = el.parentNode) => {
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
            let update = (directive[name] || directive.default)(el, attr.value, state, name);
            if (update) {
              update[_dispose] = effect(update);
              effects.push(update);
            }
          }

          // stop if element was spraed by directive or skipped (detached) like in case of :if or :each
          if (memo.has(el)) return;
          if (el.parentNode !== parent) return false;
        } else i++;
      }
    }

    for (let i = 0, child; child = el.children[i]; i++) {
      // if element was removed from parent (skipped) - reduce index
      if (init(child, el) === false) i--;
    }
  };

  init(container);

  // if element was spraed by :scope or :each instruction - skip
  if (memo.has(container)) return state// memo.get(container)

  // save
  memo.set(container, [state, effects]);
  container.classList?.add(SPRAE); // mark spraed element

  // expose dispose
  container[_dispose] = () => {
    while (effects.length) effects.pop()[_dispose]();
    container.classList.remove(SPRAE)
    memo.delete(container);
    let els = container.getElementsByClassName(SPRAE);
    while (els.length) els[0][_dispose]?.()
  }

  return state;
}

// default compiler
const evalMemo = {};

export let compile = (expr, dir, evaluate) => {
  if (evaluate = evalMemo[expr = expr.trim()]) return evaluate


  // static-time errors
  try { evaluate = new Function(`__scope`, `with (__scope) { return ${expr} };`); }
  catch (e) { throw Object.assign(e, { message: `${SPRAE} ${e.message}\n\n${dir}${expr ? `="${expr}"\n\n` : ""}`, expr }) }

  // runtime errors
  return evalMemo[expr] = evaluate
}

// DOM swapper
export let swap = swapdom

// interpolate a$<b> fields from context
export const ipol = (v, state) => {
  return v?.replace ? v.replace(/\$<([^>]+)>/g, (match, field) => state[field]?.valueOf?.() ?? '') : v
};

// configure signals/compiler/differ
// it's more compact than using sprae.signal = signal etc.
sprae.use = s => {
  s.signal && (
    signal = s.signal,
    effect = s.effect,
    computed = s.computed,
    batch = s.batch || (fn => fn()),
    untracked = s.untracked || batch
  );
  s.compile && (compile = s.compile);
  s.swap && (swap = s.swap)
}
