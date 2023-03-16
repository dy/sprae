import sprae from './core.js';
import './directives.js';
export default sprae;

// autoinit
if (document.currentScript) sprae(document.documentElement)
