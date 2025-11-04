import store from "./store.js";
import { batch, computed, effect, signal, untracked } from './core.js';
import * as signals from './signal.js';
import sprae, { use, directive, modifier, parse, throttle, debounce, _off, _state, _on, _dispose, _add, prefix, call } from './core.js';
import pkg from './package.json' with { type: 'json' };

import _if from "./directive/if.js";
import _else from "./directive/else.js";
import _text from "./directive/text.js";
import _class from "./directive/class.js";
import _style from "./directive/style.js";
import _fx from "./directive/fx.js";
import _value from "./directive/value.js";
import _ref from "./directive/ref.js";
import _scope from "./directive/scope.js";
import _each from "./directive/each.js";
import _default from "./directive/_.js";
import _event from "./directive/event.js";
import _spread from "./directive/spread.js";


use({
  compile: expr => sprae.constructor(`with (arguments[0]) { ${expr} }`),
  dir,
  ...signals
})


Object.assign(directive, {
  // default handler has syntax sugar: aliasing and sequences, eg. :ona:onb..onc:ond
  // _(el, state, expr, name, fn) { return (name.startsWith('on') ? _event : _default)(el, state, expr, name, fn) },
  _: _default,
  '': _spread,
  class: _class,
  text: _text,
  style: _style,
  fx: _fx,
  value: _value,
  ref: _ref,
  scope: _scope,
  if: _if,
  else: _else,
  each: _each
})


/**
 * Multiprop sequences initializer, eg. :a:b..c:d
 * @type {(el: HTMLElement, name:string, value:string, state:Object) => Function}
 * */
function dir(target, dirName, expr, state) {
  let cur, // current step callback
    off // current step disposal

  // steps are like state machine: entering step inits directive, exiting step disposes it
  // 99% cases there is just one step with one directive
  let steps = dirName.slice(prefix.length).split('..').map((step, i, { length }) => (
    // multiple attributes like :id:for=""
    step.split(prefix).reduce((prev, str) => {
      let [name, ...mods] = str.split('.'), createDir = directive[name] || directive._

      const event = name.startsWith('on') && name.slice(2)

      let dispose,
        change = signal(0), // signal authorized to trigger effect: 0 = init; >0 = trigger
        count = 0, // called effect count

        // effect applier - first time it applies the effect, next times effect is triggered by change signal
        fire = applyMods(sx(
          // single event vs chain
          event ? (
            length == 1 ? e => evaluate(state, (fn) => call(fn, e)) :
              e => (!i ? evaluate(state, (fn) => cur = call(fn, e)) : cur = cur(e), off(), off = steps[(i + 1) % length]())
          ) :
            // throttle prevents multiple updates within one tick as well as isolates stack for each update
            throttle(
              // NOTE: recreating effect for each fire call is not efficient than controllable cycle
              // !mods.length ? () => (dispose?.(), dispose = effect(() => evaluate(state, update))) :
              () => {
                // bump change count to plan update
                change.value++

                // all calls except for the first one are handled by effect
                dispose ||= effect(() => (
                  // if planned count is same as actual count - plan new update, else update right away
                  change.value == count ? fire() : (count = change.value, evaluate(state, update))
                ));
              },
            ),
          { target }
        ), mods)

      const update = createDir(fire.target || target, state, expr, name, fire)

      // expression can be redefined by directive (mainly :each)
      const evaluate = update?.eval ?? parse(expr).bind(target)

      // FIXME: it's a hack, must move to directive itself
      if (event) {
        return (_poff) => (_poff = prev?.(), fire.target.addEventListener(event, fire, fire), () => (_poff?.(), fire.target.removeEventListener(event, fire)))
      }

      // take over state if directive created it (mainly :scope)
      if (target[_state]) state = target[_state]

      return (_poff) => (
        _poff = prev?.(),
        // console.log('ON', name),
        fire(),
        () => (
          // console.log('OFF', name, el),
          _poff?.(), dispose?.(), dispose = null
        )
      )
    }, null)
  ));

  // off can be changed on the go
  return () => (off = steps[0]?.())
}

// apply modifiers to context (from the end due to nature of wrapping ctx.call)
const applyMods = (fn, mods) => {
  while (mods.length) {
    let [name, ...params] = mods.pop().split('-')
    fn = sx(modifier[name]?.(fn, ...params) ?? fn, fn)
  }
  return fn
}
// soft-extend missing props and ignoring signals
const sx = (a, b) => { if (a != b) for (let k in b) (a[k] ??= b[k]); return a }


Object.assign(modifier, {
  // timing
  debounce: (fn, _how = 250) => debounce(fn, (_how ||= 0, (fn) => setTimeout(fn, _how))),
  throttle: (fn, _how = 250) => throttle(fn, (_how ||= 0, (fn) => setTimeout(fn, _how))),
  tick: (fn) => (e) => queueMicrotask(() => fn(e)),
  raf: (fn) => (e) => requestAnimationFrame(() => fn(e)),
  once: (fn, _done, _fn) => Object.assign((e) => !_done && (_done = 1, fn(e)), { once: true }),

  // target
  window: fn => (fn.target = fn.target.ownerDocument.defaultView, fn),
  document: fn => (fn.target = fn.target.ownerDocument, fn),
  root: fn => (fn.target = fn.target.ownerDocument.documentElement, fn),
  body: fn => (fn.target = fn.target.ownerDocument.body, fn),
  parent: fn => (fn.target = fn.target.parentNode, fn),
  self: (fn) => (e) => (e.target === fn.target && fn(e)),
  outside: (fn) => (e, _target) => (
    _target = fn.target,
    !_target.contains(e.target) && e.target.isConnected && (_target.offsetWidth || _target.offsetHeight)
  ),

  // events
  prevent: (fn) => (e) => (e?.preventDefault(), fn(e)),
  stop: (fn) => (e) => (e?.stopPropagation(), fn(e)),
  immediate: (fn) => (e) => (e?.stopImmediatePropagation(), fn(e)),
  passive: fn => (fn.passive = true, fn),
  capture: fn => (fn.capture = true, fn),
})

// key testers
const keys = {
  ctrl: e => e.ctrlKey || e.key === "Control" || e.key === "Ctrl",
  shift: e => e.shiftKey || e.key === "Shift",
  alt: e => e.altKey || e.key === "Alt",
  meta: e => e.metaKey || e.key === "Meta",
  cmd: e => e.metaKey || e.key === "Command",
  arrow: e => e.key.startsWith("Arrow"),
  enter: e => e.key === "Enter",
  esc: e => e.key.startsWith("Esc"),
  tab: e => e.key === "Tab",
  space: e => e.key === " " || e.key === "Space" || e.key === " ",
  delete: e => e.key === "Delete" || e.key === "Backspace",
  digit: e => /^\d$/.test(e.key),
  letter: e => /^\p{L}$/gu.test(e.key),
  char: e => /^\S$/.test(e.key),
};

// augment modifiers with key testers
for (let k in keys) modifier[k] = (fn, ...params) => (e) => keys[k](e) && params.every(k => keys[k]?.(e) ?? e.key === k) && fn(e)




// expose for runtime config
sprae.use = use
sprae.store = store
sprae.directive = directive
sprae.modifier = modifier
sprae.version = pkg.version;


/**
 * Lifecycle hanger: spraes automatically any new nodes
 */
const start = sprae.start = (root = document.body, values) => {
  const state = store(values)
  sprae(root, state);
  const mo = new MutationObserver(mutations => {
    for (const m of mutations) {
      for (const el of m.addedNodes) {
        // el can be spraed or removed by subsprae (like within :each/:if)
        if (el.nodeType === 1 && el[_state] === undefined && root.contains(el)) {
          // even if element has no spraeable attrs, some of its children can have
          root[_add](el)
          // sprae(el, state, root);
        }
      }
      // for (const el of m.removedNodes) el[Symbol.dispose]?.()
    }
  });
  mo.observe(root, { childList: true, subtree: true });
  return state
}


// version placeholder for bundler
sprae.version = "[VI]{{inject}}[/VI]"

export default sprae
export { sprae, store, signal, effect, computed, batch, untracked, start, use }
