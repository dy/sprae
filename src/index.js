import sprae from './core.js';
import './directives.js';

export * from '@preact/signals-core'
export default sprae;

// autoinit
if (document.currentScript) sprae(document.documentElement)
