import sprae, { dir, parse } from './core.js'

import _if from './directive/if.js'
import _each from './directive/each.js'
import _ref from './directive/ref.js'
import _scope from './directive/scope.js'
import _text from './directive/text.js'
import _class from './directive/class.js'
import _style from './directive/style.js'
import _value from './directive/value.js'
import _fx from './directive/fx.js'
import _any from './directive/attr.js'
import _spread from './directive/_.js'
import _on from './directive/on.js'

// directives
dir('if', _if)
dir('each', _each, expr => parse(expr.split(/\b(?:in|of)\b/)[1])) // redefine evaluator to take second part of expression
dir('ref', _ref)
dir('scope', _scope)
dir('text', _text)
dir('class', _class)
dir('style', _style)
dir('value', _value)
dir('fx', _fx)
dir('', _spread)
// dir('*', _any)
dir('*', (e, s, x, n) => (n[0].startsWith('on') ? _on : _any)(e, s, x, n))


// simple eval (indirect new Function to avoid detector)
sprae.compile = expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`)


export default sprae
