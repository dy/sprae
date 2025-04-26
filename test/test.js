import './signal.js'
import './store.js'
import './core.js'
import './directive.js'


Object.defineProperty(DocumentFragment.prototype, "outerHTML", {
  get() {
    let s = "";
    this.childNodes.forEach((n) => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : "";
    });
    return s;
  },
});
