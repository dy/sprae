export * from './sprae.js'

// configure justin a default compiler
import justin from "subscript/justin.js";
import { setCompiler } from './src/core.js'

setCompiler(justin);
