import './state.js'
import './attrs.js'
import './events.js'

Object.defineProperty(DocumentFragment.prototype, 'outerHTML', {
  get() {
    let s = ''
    this.childNodes.forEach(n => {
      s += n.nodeType === 3 ? n.textContent : n.outerHTML != null ? n.outerHTML : ''
    })
    return s
  }
})
