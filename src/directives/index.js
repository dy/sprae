// order defines precedence
import './with.js'
import './each.js'
import './text.js'
import './if.js' // if must go last, after other directives are initialized, since it removes :else, :else-if from tree
import './common.js'
import './prop.js'
import './data.js'
import './aria.js'
import './value.js'
import './on.js'