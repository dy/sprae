export { default } from './src/core.js'
export { signal, effect, computed, batch } from "./src/signal.js";

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

// configure justin a default compiler
import justin from "subscript/justin.js";
import { setCompiler } from './src/core.js'

setCompiler(justin);

// // define context id getter to handle signals
// compile.id = (id) => (ctx) => ctx[id]?.valueOf();

// // redefine assign operators to handle signals
// const assign = (fn, a, b) => (
//   (b = compile(b)),
//   // set prop either directly or as signal
//   // FIXME: make sure we really need a signal for new props here
//   prop(a, (obj, path, ctx) =>
//     obj[path]?.peek
//       ? fn(obj[path], "value", b(ctx))
//       : fn(obj, path, path in obj ? b(ctx) : signal(b(ctx))),
//   )
// );
// operator("=", assign.bind(0, (obj, path, value) => (obj[path] = value)));
// operator("+=", assign.bind(0, (obj, path, value) => (obj[path] += value)));
// operator("-=", assign.bind(0, (obj, path, value) => (obj[path] -= value)));
// operator("*=", assign.bind(0, (obj, path, value) => (obj[path] *= value)));
// operator("/=", assign.bind(0, (obj, path, value) => (obj[path] /= value)));
// operator("%=", assign.bind(0, (obj, path, value) => (obj[path] %= value)));
// operator("||=", assign.bind(0, (obj, path, value) => (obj[path] ||= value)));
// operator("??=", assign.bind(0, (obj, path, value) => (obj[path] ??= value)));
