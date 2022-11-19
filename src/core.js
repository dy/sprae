import signalStruct from 'signal-struct';


// sprae element: apply directives
export default function sprae(el, init) {
  init ||= {};

  // FIXME: find out if we can move it to signal-directives, opposed to generic-directives (any-reactive-element)
  const state = signalStruct(init);

  // prepare directives - need to be after subscribing to values to get init state here
  for (let name in directives) {
    const sel = `[${name.replace(':','\\:')}]`,
          initDirective = directives[name]

    if (el.matches?.(sel)) initDirective(el, state);
    el.querySelectorAll?.(sel).forEach(el => initDirective(el, state));
  };

  return state
}

// dict of directives
const directives = {}

// register a directive
export const directive = (name, initialize) => {
  const className = name.replace(':','∴')

  // create initializer of a directive on an element
  return directives[name] = (el, state) => {
    if (el.classList.contains(className)) return
    el.classList.add(className)
    let expr = el.getAttribute(name)
    el.removeAttribute(name)
    initialize(el, expr, state)
  }
}
