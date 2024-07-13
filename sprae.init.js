import sprae from './sprae.js'

if (document?.currentScript?.hasAttribute('init')) sprae(document.documentElement)

export default sprae
