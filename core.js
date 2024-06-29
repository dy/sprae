import { use } from "./signal.js";
import store, { _signals } from './store.js';

// polyfill
const _dispose = (Symbol.dispose ||= Symbol("dispose"));

// reserved directives - order matters!
export const directive = {};

// every element that's in cache === directly spraed and un subsequent sprae is just updated (like each)
export const memo = new WeakMap();

// sprae element: apply directives
export default function sprae(el, values) {
  // text nodes, comments etc
  if (!el?.childNodes) return

  // repeated call can be caused by :each with new objects with old keys needs an update
  if (memo.has(el)) {
    // we rewrite signals instead of update, because user should have what he provided
    return Object.assign(memo.get(el), values)
  }

  // take over existing state instead of creating clone
  const state = store(values || {}), disposes = []

  init(el);

  // if element was spraed by :with or :each instruction - skip, otherwise save
  if (!memo.has(el)) memo.set(el, state);

  // disposer unspraes all internal elements
  el[_dispose] = () => {
    while (disposes.length) disposes.pop()();
    memo.delete(el);
  }

  return state;

  function init(el, parent = el.parentNode) {
    if (!el.childNodes) return // ignore text nodes, comments etc

    // init generic-name attributes second
    for (let i = 0; i < el.attributes?.length;) {
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
          if (dispose) disposes.push(dispose);
        }

        // stop if element was spraed by internal directive
        if (memo.has(el)) return el[_dispose] && disposes.push(el[_dispose])

        // stop if element is skipped (detached) like in case of :if or :each
        if (el.parentNode !== parent) return
      } else i++;
    }

    for (let child of [...el.childNodes]) init(child, el);
  };
}


// compiler
const evalMemo = {};
const parse = (expr, dir, fn) => {
  if (fn = evalMemo[expr = expr.trim()]) return fn

  // static-time errors
  try { fn = compile(expr) }
  catch (e) { err(e, dir, expr) }

  // runtime errors
  return evalMemo[expr] = fn
}

// wrapped call
export let err = (e, dir, expr = '') => {
  throw Object.assign(e, { message: `∴ ${e.message}\n\n${dir}${expr ? `="${expr}"\n\n` : ""}`, expr })
}

export let compile

// configure signals/compile
// it's more compact than using sprae.signal = signal etc.
sprae.use = s => {
  s.signal && use(s);
  s.compile && (compile = s.compile);
}


// <template> fragment holder, like persisting fragment but with minimal API surface
export const frag = (tpl) => {
  if (tpl._) return tpl // existing tpl
  let content = tpl.content.cloneNode(true)
  let attr = [...tpl.attributes]
  let _ = document.createTextNode('') // fragment holder node
  content.append(_)
  let childNodes = [...content.childNodes]
  return {
    get parentNode() { return _.parentNode },
    _,
    content,
    childNodes,
    remove() {
      content.append(...childNodes, _)
    },
    replaceWith(el) {
      if (el === content) return
      _.before(el)
      this.remove()
    },
    attributes: attr,
    removeAttribute(name) { attr.splice(attr.findIndex(a => a.name === name), 1) }
  }
}
