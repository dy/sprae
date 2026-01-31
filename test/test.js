import './signal.js'
import './store.js'
import './core.js'
import './directive.js'
import './modifier.js'
import './perf.js'
// bench.js moved to npm run bench

// switch signals to custom implementation
import { use } from '../core.js'
// import * as signals from 'ulive'
// import * as signals from 'usignal'
import * as signals from '@preact/signals-core'
// import * as signals from '@preact/signals'
// import * as signals from '@webreflection/signal'
// use(signals)

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
