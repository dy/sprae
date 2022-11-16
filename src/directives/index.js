// order defines precedence
import './each.js'
import './text.js'
import './if.js' // if must go last, after other directives are initialized, since it removes :else, :else-if from tree
import './common.js'
import './prop.js'