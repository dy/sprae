// events directive with enabled aliases and sequences like :onclick.ctrl.once..keyup.enter
import { _dispose, call, parse, decorate, prefix } from "../core.js"

export default (el, state, expr, names) => {
  let cur, // current step callback
    off // current step disposal

  let steps = names.split('..').map((step, i, { length }) => step.split(prefix).reduce(
    (prev, str) => {
      const [name, ...mods] = str.slice(2).split('.')

      const evaluate = parse(expr).bind(el)

      const trigger = decorate(Object.assign(
        e => (!i ? evaluate(state, (fn) => cur = call(fn, e)) : (cur = cur(e)), off(), off = steps[(i + 1) % length]()),
        { target: el }
      ), mods)


      return (_poff) => (
        _poff = prev?.(),
        trigger.target.addEventListener(name, trigger, trigger),
        () => (_poff?.(), trigger.target.removeEventListener(name, trigger))
      )
    }, null)
  )

  off = steps[0]()

  return {
    [Symbol.dispose]() {
      off?.()
    }
  }
}
