const event = (el, state, expr, name, mods) => {
  let type = name.slice(2);

  // let fn = applyMods(
  //           sx(
  //             // single event vs chain
  //             length == 1 ?  e => evaluate(state, (fn) => call(fn, e)) :
  //               (e => (cur = (!i ?  e => call(evaluate(state), e) : cur)(e), off(), off = steps[(i + 1) % length]())),
  //             { target: el }
  //           ),
  //           mods);

  return () => (el.addEventListener(type, fn, fn), () => (el.removeEventListener(type, fn)))
}

// prevent evaluation
event.parse = () => '';

export default event;
