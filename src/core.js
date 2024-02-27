import { use, batch } from './signal.js'

const _dispose = (Symbol.dispose ||= Symbol("dispose"));

// reserved directives - order matters!
export const directive = {};

// sprae element: apply directives
const memo = new WeakMap();
export default function sprae(container, values) {
  // repeated call can be caused by :each with new objects with old keys needs an update
  if (memo.has(container))
    return batch(() => Object.assign(memo.get(container), values));

  // take over existing state instead of creating clone
  const state = values || {};
  const disposes = [];

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
          for (let name of names) disposes.push((directive[name] || directive.default)(el, attr.value, state, name));

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
  if (memo.has(container)) return state; //memo.get(container)

  // save
  memo.set(container, state);

  // expose dispose
  if (disposes.length) container[_dispose] = () => {
    while (disposes.length) disposes.pop()?.();
    memo.delete(container);
  }

  return state;
}

// configure signals
sprae.use = use

// default compiler
sprae.compile = (src) => new Function(`__scope`, `with (__scope) { return ${src} };`)

const evalMemo = {};

// create evaluator for the expression
// FIXME: passing that amount of props is excessive
export const parse = (el, expression, dir) => {
  let evaluate = evalMemo[expression = expression.trim()];

  // guard static-time eval errors
  if (!evaluate) {
    try {
      evaluate = evalMemo[expression] = sprae.compile(expression);
    } catch (e) {
      return err(e, el, expression, dir);
    }
  }

  // guard runtime eval errors
  return (state, result) => {
    try {
      result = evaluate(state);
    } catch (e) {
      return err(e, el, expression, dir);
    }
    return result?.valueOf();
  };
}

// throw branded error
export const err = (error, element, expr, directive) => {
  Object.assign(error, { element, expr });
  console.warn(`∴ ${error.message}\n\n${directive}=${expr ? `"${expr}"\n\n` : ""}`, element);
  throw error;
}
