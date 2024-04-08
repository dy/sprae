import sprae from './core.js'
import * as signals from './signal.js'

// default signals
sprae.use(signals)

// default compiler (indirect new Function since we can use justin)
sprae.use({ compiler: expr => sprae.constructor(`__scope`, `with (__scope) { return ${expr} };`) })

export default sprae
export { signal, computed, effect, batch, untracked } from './core.js'

// default directives
import './directive/if.js'
import './directive/each.js'
import './directive/ref.js'
import './directive/scope.js'
import './directive/html.js'
import './directive/text.js'
import './directive/class.js'
import './directive/style.js'
import './directive/value.js'
import './directive/fx.js'
import './directive/default.js'
