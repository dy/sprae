// alpine flavored build

import sprae from '../core.js'

// default directives
import _if from '../directive/if.js'
import _each from '../directive/each.js'
import _ref from '../directive/ref.js'
import _with from '../directive/with.js'
import _text from '../directive/text.js'
import _class from '../directive/class.js'
import _style from '../directive/style.js'
import _value from '../directive/value.js'
import _fx from '../directive/fx.js'
import _default from '../directive/default.js'

sprae.event = '@'
sprae.prefix = 'v-'

export default (el, state) => {
  // FIXME: turn all {{}} to template frags

  return el
}

sprae.dir('scope', _with)
sprae.dir('effect', _fx)
sprae.dir('bind', _default)
sprae.dir('on', _on)
sprae.dir('model', _value)
sprae.dir('if', _if)
sprae.dir('for', _each)
sprae.dir('show', _show)
sprae.dir('html', _html)
sprae.dir('text', _text)
sprae.dir('pre', _pre) // FIXME
sprae.dir('once', _once) // FIXME
sprae.dir('cloak', _cloak)


// default compiler (indirect new Function to avoid detector)
sprae.compile = expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`)

export default sprae
