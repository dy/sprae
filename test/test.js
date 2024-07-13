import './signal.js'
import './store.js'
import './optional.js'
import './class.js'
import './each.js'
import './if.js'
import './ref.js'
import './style.js'
import './text.js'
import './value.js'
import './with.js'
import './events.js'
import './core.js'


Object.defineProperty(DocumentFragment.prototype, "outerHTML", {
  get() {
    let s = "";
    this.childNodes.forEach((n) => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : "";
    });
    return s;
  },
});
