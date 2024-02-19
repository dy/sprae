import subscript, { compile, parse, binary, operator, prop } from 'subscript/justin.js'
import 'subscript/feature/arrow.js'
import { signal } from './state.signals-proxy.js'

// define context id getter to handle signals
compile.id = id => ctx => ctx[id]?.valueOf()

const assign = (fn, a, b) => (
  b = compile(b),
  // set prop either directly or as signal
  // FIXME: make sure we really need a signal for new props here
  prop(a, (obj, path, ctx) => obj[path]?.peek ? fn(obj[path], 'value', b(ctx)) : fn(obj, path, path in obj ? b(ctx) : signal(b(ctx))))
)

// redefine assign operators to handle signals
operator('=', assign.bind(0, (obj, path, value) => obj[path] = value))
operator('+=', assign.bind(0, (obj, path, value) => obj[path] += value))
operator('-=', assign.bind(0, (obj, path, value) => obj[path] -= value))
operator('*=', assign.bind(0, (obj, path, value) => obj[path] *= value))
operator('/=', assign.bind(0, (obj, path, value) => obj[path] /= value))
operator('%=', assign.bind(0, (obj, path, value) => obj[path] %= value))


export default subscript
