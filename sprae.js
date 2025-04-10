import sprae from './core.js'

// default directives
import './directive/if.js'
import './directive/each.js'
import './directive/ref.js'
import './directive/with.js'
import './directive/text.js'
import './directive/class.js'
import './directive/style.js'
import './directive/value.js'
import './directive/fx.js'
import './directive/default.js'
import './directive/aria.js'
import './directive/data.js'

// default compiler (indirect new Function to avoid detector)
sprae.use({ compile: expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`) })

export * from './store.js'
export * from './signal.js'

export default sprae
