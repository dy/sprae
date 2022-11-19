import sprae from './core.js';
import './directives.js';

export default sprae;
export * from './core.js';

// autoinit
// NOTE: abandoning for now, since requires a separate non-module JS entry, until use-case appears
// const s = document.currentScript
// if (s && s.hasAttribute('init')) {
//   sprae(document.documentElement)
// }
