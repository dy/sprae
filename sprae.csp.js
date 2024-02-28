import sprae from './sprae.js'
export * from './sprae.js'

// configure justin a default compiler
import compile from "subscript/justin.js";
sprae.use({ compile })

export default sprae
