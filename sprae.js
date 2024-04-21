import sprae from './core.js'

import * as signals from 'ulive'
import swap from 'swapdom/deflate'

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

// default signals
sprae.use(signals)

// default compiler (indirect new Function to avoid detector)
sprae.use({ compile: expr => sprae.constructor(`__scope`, `with (__scope) { return ${expr} };`) })

// defaul dom swapper
sprae.use({ swap })

export default sprae
export * from './core.js'
export * from './signal.js'
