import sprae from '../sprae.js'
import { use } from '../core.js'

// env-based configuration for test variants
const { SPRAE_COMPILER, SPRAE_SIGNALS } = process.env

if (SPRAE_COMPILER === 'jessie') {
  const { default: jessie } = await import('subscript/jessie')
  sprae.use({ compile: jessie })
  console.log('Using jessie compiler')
}

if (SPRAE_SIGNALS === 'preact') {
  const signals = await import('@preact/signals-core')
  use(signals)
  console.log('Using preact signals')
}

// dynamic imports ensure config is applied before tests register
await import('./signal.js')
await import('./store.js')
await import('./core.js')
await import('./directive.js')
await import('./modifier.js')
await import('./perf.js')

// patch outerHTML to document fragments
Object.defineProperty(DocumentFragment.prototype, "outerHTML", {
  get() {
    let s = "";
    this.childNodes.forEach((n) => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : "";
    });
    return s;
  },
});

console.tap = (...args) => { console.log(...args); return args[args.length - 1] }
