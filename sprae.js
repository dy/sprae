import sprae from './core.js'
import { dir, mod } from './directive.js'

sprae.dir = dir
sprae.mod = mod

// simple eval (indirect new Function to avoid detector)
sprae.compile = expr => sprae.constructor(`with (arguments[0]) { return ${expr} };`)


export default sprae
