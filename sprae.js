import sprae from "./src/core.js";
import { signal, effect, computed, batch, use } from "./src/signal.js";
sprae.use = use

export default sprae
export { signal, effect, computed, use }

import './directive/if.js'
import './directive/each.js'
import './directive/ref.js'
import './directive/scope.js'
import './directive/html.js'
import './directive/text.js'
import './directive/class.js'
import './directive/style.js'
import './directive/value.js'
import './directive/default.js'
