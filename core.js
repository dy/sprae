import { use } from "./signal.js";
import { store } from './store.js';

// polyfill
export const _dispose = (Symbol.dispose ||= Symbol("dispose"));

export const _state = Symbol("state"), _on = Symbol('on'), _off = Symbol('off')


/**
 * Applies directives to an HTML element and manages its reactive state.
 *
 * @param {Element} [el=document.body] - The target HTML element to apply directives to.
 * @param {Object} [values] - Initial values to populate the element's reactive state.
 * @returns {Object} The reactive state object associated with the element.
 */
export const sprae = (el = document.body, values) => {
  // repeated call can be caused by eg. :each with new objects with old keys
  if (el[_state]) return Object.assign(el[_state], values)

  console.group('sprae')

  // take over existing state instead of creating a clone
  let state = store(values || {}),
    fx = [], offs = [], fn,
    _offd = false,
    // FIXME: on generally needs to account for events, although we call it only in :if
    on = () => (!offs && (offs = fx.map(fn => fn()))),
    off = () => (offs?.map(off => off()), offs = null)
    // prevOn = el[_on], prevOff = el[_off]

  // on/off all effects
  // FIXME: we're supposed to call prevOn/prevOff, but I can't find a test case. Some combination of :if/:scope/:each/:ref
  el[_on] = on// () => (prevOn?.(), on())
  el[_off] = off// () => (prevOn?.(), on())
  // FIXME: why it doesn't work?
  // :else :if case. :else may have children to init which is called after :if, so we plan offing instead of immediate
  // el[_off] = () => (!_offd && queueMicrotask(() => (off(), _offd = false)), _offd=true)

  // destroy
  el[_dispose] ||= () => (el[_off](), el[_off] = el[_on] = el[_dispose] = el[_state] = null)

  let init = (el, attrs = el.attributes) => {
    // we iterate live collection (subsprae can init args)
    if (attrs) for (let i = 0; i < attrs.length;) {
      let { name, value } = attrs[i]

      // we suppose
      if (name.startsWith(sprae.prefix)) {
        el.removeAttribute(name)

        // directive initializer can be redefined
        console.log('init attr',name)
        fx.push(fn = sprae.init(el, name, value, state)), offs.push(fn())

        // stop after subsprae like :each, :if, :scope etc.
        if (_state in el) return
      } else i++
    }

    // :if and :each replace element with text node, which tweaks .children length, but .childNodes length persists
    // console.group('init', el, el.childNodes)
    // for (let i = 0, child; i < (console.log(el.childNodes.length, i),el.childNodes.length); i++) child =  el.childNodes[i], console.log('run', i, child.outerHTML), child.nodeType == 1 && init(child)
    // FIXME: don't do spread here
    for (let child of [...el.childNodes]) child.nodeType == 1 && init(child)
      // console.groupEnd()
  };

  init(el);

  // if element was spraed by inline :with/:if/:each/etc instruction (meaning it has state placeholder) - skip, otherwise save _state
  // FIXME: can check for null instead?
  if (!(_state in el)) el[_state] = state

  console.groupEnd()

  return state;
}

/**
 * Initializes directive (defined by sprae build), returns "on" function that enables it
 *
 * @type {(el: HTMLElement, name:string, value:string, state:Object) => Function}
 * */
sprae.init = null

/** Registered directives */
sprae.dir = {}

/** Registered modifiers */
sprae.mod = {}

/**
 * Compiles an expression into an evaluator function.
 *
 * @type {(dir:string, expr: string, clean?: string => string) => Function}
 */
sprae.compile = null

/**
 * Attribute/event prefixes
 */
sprae.prefix = ':'

/**
 * Configure signals
 */
sprae.use = use

export default sprae
