import signalStruct from 'signal-struct';


// sprae element: apply directives
const memo = new WeakMap
export default function sprae(container, values) {
  if (memo.has(container)) return memo.get(container)

  values ||= {};

  const state = signalStruct(values);

  // FIXME: find out if we can move it to signal-directives, opposed to generic-directives (any-reactive-element)
  // prepare directives - need to be after subscribing to values to get init state here
  for (let name in directives) {
    const sel = `[${name.replaceAll(':','\\:')}]`,
          initDirective = directives[name]

    if (container.matches?.(sel)) initDirective(container, state);
    // if element got removed by directives - we avoid initializing them expecting they're initialized by other directive
    container.querySelectorAll?.(sel).forEach(el => container.contains(el) && initDirective(el, state));
  };

  memo.set(container, state)
  return state
}

// dict of directives
export const directives = {}

// register a directive
export const directive = (name, initialize) => {
  const className = name.replaceAll(':','∴')

  // create initializer of a directive on an element
  return directives[name] = (el, state) => {
    if (el.classList.contains(className)) return
    el.classList.add(className)
    let expr = el.getAttribute(name)
    el.removeAttribute(name)
    initialize(el, expr, state)
  }
}
